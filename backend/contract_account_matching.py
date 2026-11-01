import unicodedata
from collections import defaultdict


def normalize_account_name(value) -> str:
    text = unicodedata.normalize("NFKC", str(value or "")).casefold()
    text = text.replace("&", "and")
    return "".join(character for character in text if character.isalnum())


def unique_account_index(accounts):
    grouped = defaultdict(list)
    for account in accounts:
        key = normalize_account_name(account.name)
        if key:
            grouped[key].append(account)
    return grouped


def unique_account_match(index, value):
    matches = index.get(normalize_account_name(value), [])
    return matches[0] if len(matches) == 1 else None
