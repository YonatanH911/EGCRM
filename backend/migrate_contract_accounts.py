import argparse
from dataclasses import dataclass

from contract_account_matching import normalize_account_name, unique_account_index
from database import SessionLocal
from models import Account, Contract


@dataclass
class MatchSummary:
    scanned: int = 0
    matched: int = 0
    already_linked: int = 0
    unmatched: int = 0
    ambiguous: int = 0


def match_contract_accounts(db, apply=False):
    account_index = unique_account_index(db.query(Account).all())
    summary = MatchSummary()
    examples = []

    for contract in db.query(Contract).order_by(Contract.id):
        for role in ("beneficiary", "supplier"):
            title = getattr(contract, f"{role}_title")
            account_id_field = f"{role}_account_id"
            summary.scanned += 1

            if getattr(contract, account_id_field):
                summary.already_linked += 1
                continue
            if not title:
                summary.unmatched += 1
                continue

            candidates = account_index.get(normalize_account_name(title), [])
            if len(candidates) == 1:
                account = candidates[0]
                summary.matched += 1
                if apply:
                    setattr(contract, account_id_field, account.id)
                    setattr(contract, f"{role}_title", account.name)
                continue

            if len(candidates) > 1:
                summary.ambiguous += 1
                reason = "ambiguous"
            else:
                summary.unmatched += 1
                reason = "unmatched"
            if len(examples) < 20:
                examples.append(f"{contract.id} | {role} | {reason} | {title}")

    if apply:
        for contract in db.query(Contract).filter(
            Contract.beneficiary_title.isnot(None),
            Contract.supplier_title.isnot(None),
        ):
            contract.title = f"{contract.beneficiary_title} - {contract.supplier_title}"
        db.commit()
    else:
        db.rollback()

    print(f"Mode: {'APPLY' if apply else 'DRY RUN'}")
    print(f"Contract roles scanned: {summary.scanned}")
    print(f"Matched: {summary.matched}")
    print(f"Already linked: {summary.already_linked}")
    print(f"Unmatched: {summary.unmatched}")
    print(f"Ambiguous: {summary.ambiguous}")
    if examples:
        print("\nExamples requiring manual selection:")
        for example in examples:
            print(f"  {example}")
    if not apply:
        print("Dry run only; no contracts were changed.")
    return summary


def main():
    parser = argparse.ArgumentParser(
        description="Match legacy contract beneficiary and supplier titles to accounts."
    )
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    with SessionLocal() as db:
        match_contract_accounts(db, apply=args.apply)


if __name__ == "__main__":
    main()
