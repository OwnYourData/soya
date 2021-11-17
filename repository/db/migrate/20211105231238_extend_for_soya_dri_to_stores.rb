class ExtendForSoyaDriToStores < ActiveRecord::Migration[5.2]
  def change
    add_column :stores, :soya_dri, :string
    add_index :stores, :soya_dri, :unique => false
  end
end
