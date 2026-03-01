from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
from fastapi.middleware.cors import CORSMiddleware

import models, schemas, crud, auth
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="CRM System API")

# Setup CORS for the frontend Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except auth.JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/me/", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# --- Accounts API ---
@app.post("/accounts/", response_model=schemas.AccountResponse)
def create_account(account: schemas.AccountCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_account(db=db, account=account)

@app.get("/accounts/", response_model=List[schemas.AccountResponse])
def read_accounts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_accounts(db, skip=skip, limit=limit)

@app.get("/accounts/{account_id}", response_model=schemas.AccountResponse)
def read_account(account_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_account = crud.get_account(db, account_id=account_id)
    if db_account is None:
        raise HTTPException(status_code=404, detail="Account not found")
    return db_account

@app.put("/accounts/{account_id}", response_model=schemas.AccountResponse)
def update_account(account_id: int, account: schemas.AccountUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_account = crud.update_account(db, account_id=account_id, account_update=account)
    if db_account is None:
        raise HTTPException(status_code=404, detail="Account not found")
    return db_account

@app.delete("/accounts/{account_id}")
def delete_account(account_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        db_account = crud.delete_account(db, account_id=account_id)
        if not db_account:
            raise HTTPException(status_code=404, detail="Account not found")
        return {"message": "Account deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Cannot delete account that is linked to existing records.")

# --- Contacts API ---
@app.post("/contacts/", response_model=schemas.ContactResponse)
def create_contact(contact: schemas.ContactCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_contact(db=db, contact=contact)

@app.get("/contacts/", response_model=List[schemas.ContactResponse])
def read_contacts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_contacts(db, skip=skip, limit=limit)

@app.get("/contacts/{contact_id}", response_model=schemas.ContactResponse)
def read_contact(contact_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_contact = crud.get_contact(db, contact_id=contact_id)
    if db_contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    return db_contact

@app.put("/contacts/{contact_id}", response_model=schemas.ContactResponse)
def update_contact(contact_id: int, contact: schemas.ContactUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_contact = crud.update_contact(db, contact_id=contact_id, contact_update=contact)
    if db_contact is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    return db_contact

@app.delete("/contacts/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        db_contact = crud.delete_contact(db, contact_id=contact_id)
        if not db_contact:
            raise HTTPException(status_code=404, detail="Contact not found")
        return {"message": "Contact deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Cannot delete contact that is linked to existing records.")

# --- Leads API ---
@app.post("/leads/", response_model=schemas.LeadResponse)
def create_lead(lead: schemas.LeadCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_lead(db=db, lead=lead)

@app.get("/leads/", response_model=List[schemas.LeadResponse])
def read_leads(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_leads(db, skip=skip, limit=limit)

@app.patch("/leads/{lead_id}/status", response_model=schemas.LeadResponse)
def update_lead_status(lead_id: int, status: models.LeadStatus, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    lead = crud.update_lead_status(db, lead_id=lead_id, status=status)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

# --- Contracts API ---
@app.post("/contracts/", response_model=schemas.ContractResponse)
def create_contract(contract: schemas.ContractCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_contract(db=db, contract=contract)

@app.get("/contracts/", response_model=List[schemas.ContractResponse])
def read_contracts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_contracts(db, skip=skip, limit=limit)

@app.get("/contracts/{contract_id}", response_model=schemas.ContractResponse)
def read_contract(contract_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_contract = crud.get_contract(db, contract_id=contract_id)
    if db_contract is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    return db_contract

@app.put("/contracts/{contract_id}", response_model=schemas.ContractResponse)
def update_contract(contract_id: int, contract: schemas.ContractBase, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_contract = crud.update_contract(db, contract_id=contract_id, contract_update=contract)
    if db_contract is None:
        raise HTTPException(status_code=404, detail="Contract not found")
    return db_contract

@app.delete("/contracts/{contract_id}")
def delete_contract(contract_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_contract = crud.get_contract(db, contract_id=contract_id)
    if not db_contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    db.delete(db_contract)
    db.commit()
    return {"message": "Contract deleted successfully"}

# --- Vaults API ---
@app.post("/vaults/", response_model=schemas.VaultResponse)
def create_vault(vault: schemas.VaultCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_vault(db=db, vault=vault)

@app.get("/vaults/", response_model=List[schemas.VaultResponse])
def read_vaults(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_vaults(db, skip=skip, limit=limit)

@app.get("/vaults/{vault_id}", response_model=schemas.VaultResponse)
def read_vault(vault_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_vault = crud.get_vault(db, vault_id=vault_id)
    if db_vault is None:
        raise HTTPException(status_code=404, detail="Vault not found")
    return db_vault

@app.put("/vaults/{vault_id}", response_model=schemas.VaultResponse)
def update_vault(vault_id: int, vault: schemas.VaultUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_vault = crud.update_vault(db, vault_id=vault_id, vault_update=vault)
    if db_vault is None:
        raise HTTPException(status_code=404, detail="Vault not found")
    return db_vault

# --- Deposits API ---
@app.post("/deposits/", response_model=schemas.DepositResponse)
def create_deposit(deposit: schemas.DepositCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_deposit(db=db, deposit=deposit)

@app.get("/deposits/", response_model=List[schemas.DepositResponse])
def read_deposits(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_deposits(db, skip=skip, limit=limit)

@app.get("/deposits/{deposit_id}", response_model=schemas.DepositResponse)
def read_deposit(deposit_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_deposit = crud.get_deposit(db, deposit_id=deposit_id)
    if db_deposit is None:
        raise HTTPException(status_code=404, detail="Deposit not found")
    return db_deposit

@app.put("/deposits/{deposit_id}", response_model=schemas.DepositResponse)
def update_deposit(deposit_id: int, deposit: schemas.DepositUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_deposit = crud.update_deposit(db, deposit_id=deposit_id, deposit_update=deposit)
    if db_deposit is None:
        raise HTTPException(status_code=404, detail="Deposit not found")
    return db_deposit

# --- Activities API ---
@app.get("/activities/", response_model=List[schemas.ActivityResponse])
def read_activities(skip: int = 0, limit: int = 500, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_activities(db, skip=skip, limit=limit)

@app.post("/activities/", response_model=schemas.ActivityResponse)
def create_activity(activity: schemas.ActivityCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.create_activity(db=db, activity=activity)

@app.get("/activities/{activity_id}", response_model=schemas.ActivityResponse)
def read_activity(activity_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_activity = crud.get_activity(db, activity_id=activity_id)
    if db_activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    return db_activity

@app.put("/activities/{activity_id}", response_model=schemas.ActivityResponse)
def update_activity(activity_id: int, activity: schemas.ActivityUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_activity = crud.update_activity(db, activity_id=activity_id, activity_update=activity)
    if db_activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    return db_activity

@app.delete("/activities/{activity_id}")
def delete_activity(activity_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_activity = crud.delete_activity(db, activity_id=activity_id)
    if not db_activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    return {"message": "Activity deleted successfully"}

