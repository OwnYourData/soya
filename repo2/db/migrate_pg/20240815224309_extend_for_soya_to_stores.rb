class ExtendForSoyaToStores < ActiveRecord::Migration[5.2]
  def change
    add_column :stores, :soya_name, :string
    add_index :stores, :soya_name, :unique => false
    add_column :stores, :soya_dri, :string
    add_index :stores, :soya_dri, :unique => false
    add_column :stores, :soya_yaml, :text
  end
end
