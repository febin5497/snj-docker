from setuptools import setup, find_packages

setup(
    name="shared-lib",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "Flask>=3.0",
        "Flask-SQLAlchemy>=3.1",
        "Flask-JWT-Extended>=4.6",
        "Flask-CORS>=4.0",
        "psycopg2-binary>=2.9",
        "redis>=5.0",
        "gunicorn>=21.2",
        "bcrypt>=4.1",
    ],
)
