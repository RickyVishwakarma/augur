"""updated revision data size to 128

Revision ID: 12
Revises: 11
Create Date: 2022-10-06 01:28:48.146894

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '12'
down_revision = '11'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('releases', 'release_id',
               existing_type=sa.CHAR(length=64),
               type_=sa.CHAR(length=128),
               existing_nullable=False,
               existing_server_default=sa.text('nextval(\'"augur_data".releases_release_id_seq\'::regclass)'),
               schema='augur_data')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('releases', 'release_id',
               existing_type=sa.CHAR(length=128),
               type_=sa.CHAR(length=64),
               existing_nullable=False,
               existing_server_default=sa.text('nextval(\'"augur_data".releases_release_id_seq\'::regclass)'),
               schema='augur_data')
    op.drop_constraint(None, 'commits', schema='augur_data', type_='foreignkey')
    # ### end Alembic commands ###
