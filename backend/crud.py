from sqlalchemy.orm import Session, joinedload
import models, schemas, auth

# --- Users ---
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        name=user.name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Accounts ---
def get_account(db: Session, account_id: int):
    return db.query(models.Account).filter(models.Account.id == account_id).first()

def get_accounts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Account).offset(skip).limit(limit).all()

def create_account(db: Session, account: schemas.AccountCreate):
    db_account = models.Account(**account.model_dump())
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def update_account(db: Session, account_id: int, account_update: schemas.AccountUpdate):
    db_account = get_account(db, account_id)
    if db_account:
        update_data = account_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_account, key, value)
        db.commit()
        db.refresh(db_account)
    return db_account

def delete_account(db: Session, account_id: int):
    db_account = get_account(db, account_id)
    if db_account:
        db.delete(db_account)
        db.commit()
    return db_account

# --- Contacts ---
def get_contact(db: Session, contact_id: int):
    return db.query(models.Contact).filter(models.Contact.id == contact_id).first()

def get_contacts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Contact).offset(skip).limit(limit).all()

def create_contact(db: Session, contact: schemas.ContactCreate):
    db_contact = models.Contact(**contact.model_dump())
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

def update_contact(db: Session, contact_id: int, contact_update: schemas.ContactUpdate):
    db_contact = get_contact(db, contact_id)
    if db_contact:
        update_data = contact_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_contact, key, value)
        db.commit()
        db.refresh(db_contact)
    return db_contact

def delete_contact(db: Session, contact_id: int):
    db_contact = get_contact(db, contact_id)
    if db_contact:
        db.delete(db_contact)
        db.commit()
    return db_contact

# --- Leads ---
def get_leads(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Lead).offset(skip).limit(limit).all()

def create_lead(db: Session, lead: schemas.LeadCreate):
    db_lead = models.Lead(**lead.model_dump())
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead

def update_lead_status(db: Session, lead_id: int, status: models.LeadStatus):
    db_lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if db_lead:
        db_lead.status = status
        db.commit()
        db.refresh(db_lead)
    return db_lead

# --- Contracts ---
def get_contract(db: Session, contract_id: int):
    return db.query(models.Contract).filter(models.Contract.id == contract_id).first()

def get_contracts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Contract).offset(skip).limit(limit).all()

def create_contract(db: Session, contract: schemas.ContractCreate):
    db_contract = models.Contract(**contract.model_dump())
    db.add(db_contract)
    db.commit()
    db.refresh(db_contract)
    return db_contract

def update_contract(db: Session, contract_id: int, contract_update: schemas.ContractBase):
    db_contract = get_contract(db, contract_id)
    if db_contract:
        update_data = contract_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_contract, key, value)
        db.commit()
        db.refresh(db_contract)
    return db_contract

# --- Vaults ---
def get_vault(db: Session, vault_id: int):
    return db.query(models.Vault).filter(models.Vault.id == vault_id).first()

def get_vaults(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Vault).offset(skip).limit(limit).all()

def create_vault(db: Session, vault: schemas.VaultCreate):
    db_vault = models.Vault(**vault.model_dump())
    db.add(db_vault)
    db.commit()
    db.refresh(db_vault)
    return db_vault

def update_vault(db: Session, vault_id: int, vault_update: schemas.VaultUpdate):
    db_vault = get_vault(db, vault_id)
    if db_vault:
        update_data = vault_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_vault, key, value)
        db.commit()
        db.refresh(db_vault)
    return db_vault

# --- Deposits ---
def get_deposit(db: Session, deposit_id: int):
    return db.query(models.Deposit).filter(models.Deposit.id == deposit_id).first()

def get_deposits(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Deposit).offset(skip).limit(limit).all()

def create_deposit(db: Session, deposit: schemas.DepositCreate):
    db_deposit = models.Deposit(**deposit.model_dump())
    db.add(db_deposit)
    db.commit()
    db.refresh(db_deposit)
    return db_deposit

def update_deposit(db: Session, deposit_id: int, deposit_update: schemas.DepositUpdate):
    db_deposit = get_deposit(db, deposit_id)
    if db_deposit:
        update_data = deposit_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_deposit, key, value)
        db.commit()
        db.refresh(db_deposit)
    return db_deposit

# --- Activities ---
def get_activity(db: Session, activity_id: int):
    return db.query(models.Activity).options(joinedload(models.Activity.task_type)).filter(models.Activity.id == activity_id).first()

def get_activities(db: Session, skip: int = 0, limit: int = 500):
    return db.query(models.Activity).options(joinedload(models.Activity.task_type)).order_by(models.Activity.created_at.desc()).offset(skip).limit(limit).all()

def create_activity(db: Session, activity: schemas.ActivityCreate):
    db_activity = models.Activity(**activity.model_dump())
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity

def update_activity(db: Session, activity_id: int, activity_update: schemas.ActivityUpdate):
    db_activity = get_activity(db, activity_id)
    if db_activity:
        update_data = activity_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_activity, key, value)
        db.commit()
        db.refresh(db_activity)
    return db_activity

def delete_activity(db: Session, activity_id: int):
    db_activity = get_activity(db, activity_id)
    if db_activity:
        db.delete(db_activity)
        db.commit()
    return db_activity

# --- Task Types ---
def get_task_types(db: Session):
    return db.query(models.TaskType).order_by(models.TaskType.name).all()

def create_task_type(db: Session, task_type: schemas.TaskTypeCreate):
    db_obj = models.TaskType(**task_type.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_task_type(db: Session, task_type_id: int, task_type: schemas.TaskTypeBase):
    db_obj = db.query(models.TaskType).filter(models.TaskType.id == task_type_id).first()
    if db_obj:
        for key, value in task_type.model_dump(exclude_unset=True).items():
            setattr(db_obj, key, value)
        db.commit()
        db.refresh(db_obj)
    return db_obj

def delete_task_type(db: Session, task_type_id: int):
    db_obj = db.query(models.TaskType).filter(models.TaskType.id == task_type_id).first()
    if db_obj:
        # Before deleting, nullify any associated activities or let the DB handle it if cascading
        # Currently the FK is nullable=True, so when task_type is deleted, relationships will
        # either block or set null depending on DB. We manually set to null to be safe:
        db.query(models.Activity).filter(models.Activity.task_type_id == task_type_id).update({
            models.Activity.task_type_id: None
        })
        db.delete(db_obj)
        db.commit()
    return db_obj
