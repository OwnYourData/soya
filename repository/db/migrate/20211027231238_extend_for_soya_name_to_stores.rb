class ExtendForSoyaNameToStores < ActiveRecord::Migration[5.2]
  def change
    add_column :stores, :soya_name, :string
    add_index :stores, :soya_name, :unique => false
  end
end
