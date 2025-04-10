import io
import os
import re

from setuptools import find_packages
from setuptools import setup

def read(filename):
    filename = os.path.join(os.path.dirname(__file__), filename)
    text_type = type(u"")
    with io.open(filename, mode="r", encoding='utf-8') as fd:
        return re.sub(text_type(r':[a-z]+:`~?(.*?)`'), text_type(r'``\1``'), fd.read())

setup(
    name="pull_request_analysis_worker",
    version="0.0.0",
    url="https://github.com/chaoss/augur",
    license='MIT',
    author="Augur Team",
    author_email="akshblr555@gmail.com",
    description="Pull Request Analysis worker that predicts acceptance of a PR",
    packages=find_packages(),
    install_requires=[
        'Flask==2.0.2',
        'Flask-Cors==4.0.1',
        'Flask-Login==0.5.0',
        'Flask-WTF==1.0.0',
        'requests==2.32.0',
        'psycopg2-binary==2.9.9',
        'sklearn==0.0',
        'nltk==3.6.6',
        'numpy==1.26.0',
        'pandas==1.5.3',
        'emoji==1.2.0',
        'joblib==1.2.0',
        'xgboost==1.4.2',
        'scipy>=1.10.0'
    ],
    classifiers=[
        'Development Status :: 2 - Pre-Alpha',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.7',
    ]
    
)
