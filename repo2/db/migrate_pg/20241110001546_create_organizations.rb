class CreateOrganizations < ActiveRecord::Migration[7.1]
  def change
    create_table :organizations do |t|
      t.string :name
      t.boolean :deleted, default: false

      t.timestamps
    end

    add_index :organizations, :name

  end
end
