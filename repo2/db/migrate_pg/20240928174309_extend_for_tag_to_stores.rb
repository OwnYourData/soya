class ExtendForTagToStores < ActiveRecord::Migration[5.2]
  def change
    add_column :stores, :soya_tag, :string
    add_index :stores, [:soya_name, :soya_tag], unique: true
  end
end
