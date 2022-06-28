class ExtendForSoyaYamlToStores < ActiveRecord::Migration[5.2]
  def change
    add_column :stores, :soya_yaml, :text
  end
end
