class AddUserToStores < ActiveRecord::Migration[7.1]
  def change
    add_column :stores, :user_id, :integer, null: true
  end
end
