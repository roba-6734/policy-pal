"""Add user_id foreign key to policy summaries"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20240910_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "policy_summaries",
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=True)
    )
    op.create_index(
        op.f("ix_policy_summaries_user_id"),
        "policy_summaries",
        ["user_id"],
        unique=False
    )
    op.create_foreign_key(
        "policy_summaries_user_id_fkey",
        "policy_summaries",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE"
    )


def downgrade() -> None:
    op.drop_constraint("policy_summaries_user_id_fkey", "policy_summaries", type_="foreignkey")
    op.drop_index(op.f("ix_policy_summaries_user_id"), table_name="policy_summaries")
    op.drop_column("policy_summaries", "user_id")
