from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class JobORM(Base):
    __tablename__ = 'jobs'
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String, nullable=False)
    posted_date = Column(DateTime, nullable=False)
    description = Column(String, nullable=True)
    jurisdiction = Column(String, nullable=True)
    practice_area = Column(String, nullable=True)
    seniority = Column(String, nullable=True)
    employment_type = Column(String, nullable=True)
