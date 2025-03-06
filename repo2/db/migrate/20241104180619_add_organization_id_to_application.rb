class AddOrganizationIdToApplication < ActiveRecord::Migration[5.2]
  def change
    add_column :oauth_applications, :organization_id, :integer, null: true
    add_index :oauth_applications, :organization_id
  end
end
