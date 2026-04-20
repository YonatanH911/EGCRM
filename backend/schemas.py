from pydantic import BaseModel, EmailStr, model_validator
from typing import Optional, List, Any
from datetime import datetime
from models import LeadStatus, UserRole, ContractStatus, VaultStatus, DepositStatus

class BaseSchema(BaseModel):
    @model_validator(mode='before')
    @classmethod
    def empty_str_to_none(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return {k: (None if v == "" else v) for k, v in data.items()}
        return data

# ----------------- User Schemas -----------------
class UserBase(BaseSchema):
    email: EmailStr
    name: str
    role: UserRole = UserRole.SALES

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

# ----------------- Token Schemas -----------------
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# ----------------- Account Schemas -----------------
class AccountBase(BaseSchema):
    name: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state_or_province: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None

class AccountCreate(AccountBase):
    pass

class AccountUpdate(AccountBase):
    pass

class AccountResponse(AccountBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Contact Schemas -----------------
class ContactBase(BaseSchema):
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    mobile_phone: Optional[str] = None
    is_israeli: Optional[bool] = None
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    supplier: Optional[str] = None
    description: Optional[str] = None
    account_id: Optional[int] = None

class ContactCreate(ContactBase):
    pass

class ContactUpdate(ContactBase):
    pass

class ContactResponse(ContactBase):
    id: int
    created_at: datetime
    account: Optional[AccountResponse] = None

    class Config:
        from_attributes = True

# ----------------- Lead Schemas -----------------
class LeadBase(BaseSchema):
    title: str
    status: LeadStatus = LeadStatus.NEW
    value: float = 0.0
    contact_id: Optional[int] = None
    assigned_to_user_id: Optional[int] = None

class LeadCreate(LeadBase):
    pass

class LeadResponse(LeadBase):
    id: int
    created_at: datetime
    contact: Optional[ContactResponse] = None
    assigned_user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# ----------------- Contract Schemas -----------------
class ContractBase(BaseSchema):
    title: str
    status: ContractStatus = ContractStatus.DRAFT
    value: float = 0.0
    currency: Optional[str] = "USD"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    beneficiary_management_contact: Optional[str] = None
    beneficiary_technical_contact: Optional[str] = None
    beneficiary_financial_contact: Optional[str] = None
    supplier_management_contact: Optional[str] = None
    supplier_technical_contact: Optional[str] = None
    supplier_financial_contact: Optional[str] = None
    paid_by: Optional[str] = None
    account_id: Optional[int] = None

class ContractCreate(ContractBase):
    pass

class ContractResponse(ContractBase):
    id: int
    created_at: datetime
    account: Optional[AccountResponse] = None

    class Config:
        from_attributes = True

# ----------------- Vault Schemas -----------------
class VaultBase(BaseSchema):
    name: str
    location: Optional[str] = None
    capacity: Optional[str] = None
    status: VaultStatus = VaultStatus.OPEN

class VaultCreate(VaultBase):
    pass

class VaultUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[str] = None
    status: Optional[VaultStatus] = None

class VaultResponse(VaultBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Deposit Schemas -----------------
class DepositBase(BaseSchema):
    reference_number: str
    amount: float
    date: Optional[datetime] = None
    status: DepositStatus = DepositStatus.PENDING
    product_name: Optional[str] = None
    version: Optional[str] = None
    supplier: Optional[str] = None
    box: Optional[str] = None
    received_by: Optional[str] = None
    account_id: Optional[int] = None
    vault_id: Optional[int] = None

class DepositCreate(DepositBase):
    pass

class DepositUpdate(BaseModel):
    reference_number: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[datetime] = None
    status: Optional[DepositStatus] = None
    product_name: Optional[str] = None
    version: Optional[str] = None
    supplier: Optional[str] = None
    box: Optional[str] = None
    received_by: Optional[str] = None
    account_id: Optional[int] = None
    vault_id: Optional[int] = None

class DepositResponse(DepositBase):
    id: int
    created_at: datetime
    account: Optional[AccountResponse] = None
    vault: Optional[VaultResponse] = None

    class Config:
        from_attributes = True

# ----------------- Activity Schemas -----------------
class ActivityBase(BaseSchema):
    task_type_id: Optional[int] = None
    subject: str
    regarding: Optional[str] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None

class ActivityCreate(ActivityBase):
    pass

class ActivityUpdate(BaseModel):
    task_type_id: Optional[int] = None
    subject: Optional[str] = None
    regarding: Optional[str] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None

class ActivityResponse(ActivityBase):
    id: int
    created_at: datetime
    task_type: Optional["TaskTypeResponse"] = None

    class Config:
        from_attributes = True

# ----------------- TaskType Schemas -----------------
class TaskTypeBase(BaseSchema):
    name: str
    color: str = "#6366f1"

class TaskTypeCreate(TaskTypeBase):
    pass

class TaskTypeResponse(TaskTypeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
