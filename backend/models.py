from sqlalchemy import Column, Integer, String, Enum, Float, ForeignKey, DateTime, Boolean, Text, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
import enum

contact_accounts = Table(
    "contact_accounts",
    Base.metadata,
    Column("contact_id", Integer, ForeignKey("contacts.id", ondelete="CASCADE"), primary_key=True),
    Column("account_id", Integer, ForeignKey("accounts.id", ondelete="CASCADE"), primary_key=True),
)

lead_contacts = Table(
    "lead_contacts",
    Base.metadata,
    Column("lead_id", Integer, ForeignKey("leads.id", ondelete="CASCADE"), primary_key=True),
    Column("contact_id", Integer, ForeignKey("contacts.id", ondelete="CASCADE"), primary_key=True),
)

contract_accounts = Table(
    "contract_accounts",
    Base.metadata,
    Column("contract_id", Integer, ForeignKey("contracts.id", ondelete="CASCADE"), primary_key=True),
    Column("account_id", Integer, ForeignKey("accounts.id", ondelete="CASCADE"), primary_key=True),
)

contract_deposits = Table(
    "contract_deposits",
    Base.metadata,
    Column("contract_id", Integer, ForeignKey("contracts.id", ondelete="CASCADE"), primary_key=True),
    Column("deposit_id", Integer, ForeignKey("deposits.id", ondelete="CASCADE"), primary_key=True),
)

deposit_accounts = Table(
    "deposit_accounts",
    Base.metadata,
    Column("deposit_id", Integer, ForeignKey("deposits.id", ondelete="CASCADE"), primary_key=True),
    Column("account_id", Integer, ForeignKey("accounts.id", ondelete="CASCADE"), primary_key=True),
)

deposit_vaults = Table(
    "deposit_vaults",
    Base.metadata,
    Column("deposit_id", Integer, ForeignKey("deposits.id", ondelete="CASCADE"), primary_key=True),
    Column("vault_id", Integer, ForeignKey("vaults.id", ondelete="CASCADE"), primary_key=True),
)

deposit_contacts = Table(
    "deposit_contacts",
    Base.metadata,
    Column("deposit_id", Integer, ForeignKey("deposits.id", ondelete="CASCADE"), primary_key=True),
    Column("contact_id", Integer, ForeignKey("contacts.id", ondelete="CASCADE"), primary_key=True),
)

class LeadStatus(str, enum.Enum):
    NEW = "New"
    CONTACTED = "Contacted"
    QUALIFIED = "Qualified"
    LOST = "Lost"

class ContractStatus(str, enum.Enum):
    DRAFT = "Draft"
    ACTIVE = "Active"
    EXPIRED = "Expired"
    TERMINATED = "Terminated"

class VaultStatus(str, enum.Enum):
    OPEN = "Open"
    LOCKED = "Locked"
    MAINTENANCE = "Maintenance"

class DepositStatus(str, enum.Enum):
    PENDING = "Pending"
    CLEARED = "Cleared"
    FAILED = "Failed"

class TaskType(Base):
    __tablename__ = "task_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)
    color = Column(String(20), nullable=False, default="#6366f1")
    created_at = Column(DateTime, default=datetime.utcnow)

    activities = relationship("Activity", back_populates="task_type")

class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    SALES = "Sales"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.SALES)

    leads = relationship("Lead", back_populates="assigned_user")

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=True)
    industry = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    
    # Address fields
    street = Column(String(255), nullable=True)
    city = Column(String(255), nullable=True)
    state_or_province = Column(String(255), nullable=True)
    zip_code = Column(String(50), nullable=True)
    country = Column(String(255), nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    contacts = relationship("Contact", back_populates="account")
    contracts = relationship("Contract", back_populates="account")
    deposits = relationship("Deposit", back_populates="account")

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=False)
    middle_name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, index=True)
    phone = Column(String(50))
    mobile_phone = Column(String(50), nullable=True)
    is_israeli = Column(Boolean, default=False, nullable=True)
    job_title = Column(String(255), nullable=True)
    company_name = Column(String(255), nullable=True)
    supplier = Column(String(255), nullable=True)
    description = Column(String(1000), nullable=True)
    account_id = Column(Integer, ForeignKey("accounts.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    account = relationship("Account", back_populates="contacts")
    accounts = relationship("Account", secondary=contact_accounts)
    leads = relationship("Lead", back_populates="contact")
    deposits = relationship("Deposit", secondary=deposit_contacts)

    @property
    def account_ids(self):
        ids = [account.id for account in self.accounts]
        if self.account_id and self.account_id not in ids:
            ids.insert(0, self.account_id)
        return ids

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    status = Column(Enum(LeadStatus), default=LeadStatus.NEW)
    value = Column(Float, default=0.0)
    
    contact_id = Column(Integer, ForeignKey("contacts.id"))
    assigned_to_user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    contact = relationship("Contact", back_populates="leads")
    contacts = relationship("Contact", secondary=lead_contacts)
    assigned_user = relationship("User", back_populates="leads")

    @property
    def contact_ids(self):
        ids = [contact.id for contact in self.contacts]
        if self.contact_id and self.contact_id not in ids:
            ids.insert(0, self.contact_id)
        return ids

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    status = Column(Enum(ContractStatus), default=ContractStatus.DRAFT)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    value = Column(Float, default=0.0)
    currency = Column(String(10), nullable=True, default="USD")

    beneficiary_management_contact = Column(String(255), nullable=True)
    beneficiary_technical_contact   = Column(String(255), nullable=True)
    beneficiary_financial_contact   = Column(String(255), nullable=True)

    supplier_management_contact = Column(String(255), nullable=True)
    supplier_technical_contact  = Column(String(255), nullable=True)
    supplier_financial_contact  = Column(String(255), nullable=True)
    paid_by                     = Column(String(255), nullable=True)

    account_id = Column(Integer, ForeignKey("accounts.id"))
    deposit_id = Column(Integer, ForeignKey("deposits.id"), nullable=True)
    product_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    account = relationship("Account", back_populates="contracts")
    accounts = relationship("Account", secondary=contract_accounts)
    deposits = relationship("Deposit", secondary=contract_deposits)

    @property
    def account_ids(self):
        ids = [account.id for account in self.accounts]
        if self.account_id and self.account_id not in ids:
            ids.insert(0, self.account_id)
        return ids

    @property
    def deposit_ids(self):
        ids = [deposit.id for deposit in self.deposits]
        if self.deposit_id and self.deposit_id not in ids:
            ids.insert(0, self.deposit_id)
        return ids

class Vault(Base):
    __tablename__ = "vaults"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255))
    capacity = Column(String(255))
    status = Column(Enum(VaultStatus), default=VaultStatus.OPEN)
    created_at = Column(DateTime, default=datetime.utcnow)

    deposits = relationship("Deposit", back_populates="vault")

class Deposit(Base):
    __tablename__ = "deposits"

    id = Column(Integer, primary_key=True, index=True)
    reference_number = Column(String(255), unique=True, index=True, nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(DepositStatus), default=DepositStatus.PENDING)
    product_name = Column(String(255), nullable=True)
    version = Column(String(255), nullable=True)
    supplier = Column(String(255), nullable=True)
    is_confirmation_sent = Column(Boolean, default=False, nullable=True)
    description = Column(String(1000), nullable=True)
    received_by = Column(String(255), nullable=True)
    
    account_id = Column(Integer, ForeignKey("accounts.id"))
    vault_id = Column(Integer, ForeignKey("vaults.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    account = relationship("Account", back_populates="deposits")
    vault = relationship("Vault", back_populates="deposits")
    accounts = relationship("Account", secondary=deposit_accounts)
    vaults = relationship("Vault", secondary=deposit_vaults)
    contacts = relationship("Contact", secondary=deposit_contacts)

    @property
    def account_ids(self):
        ids = [account.id for account in self.accounts]
        if self.account_id and self.account_id not in ids:
            ids.insert(0, self.account_id)
        return ids

    @property
    def vault_ids(self):
        ids = [vault.id for vault in self.vaults]
        if self.vault_id and self.vault_id not in ids:
            ids.insert(0, self.vault_id)
        return ids

    @property
    def contact_ids(self):
        return [contact.id for contact in self.contacts]

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    task_type_id = Column(Integer, ForeignKey("task_types.id"), nullable=True)
    subject = Column(String(255), nullable=False)
    regarding = Column(String(255), nullable=True)
    start_date = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    task_type = relationship("TaskType", back_populates="activities")
