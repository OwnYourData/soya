class CreateUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :users do |t|
      t.string :name
      t.integer :organization_id
      t.string :full_name
      t.boolean :deleted, default: false

      t.timestamps
    end

    add_index :users, :name
    add_index :users, :organization_id
    add_index :users, [:name, :organization_id]
  end
end
