import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';

import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useCallback } from 'react';
import { sort } from '../utils';

interface SelectItem {
  value: string;
  text: string;
}

const MultiSelect = (props: ControlProps) => {
  let {
    id,
    schema,
    label,
    description,
    handleChange,
    path,
    data = [],
  } = props;

  const getItems = useCallback((): SelectItem[] => {
    // support both `enum` and `oneOf`
    const items: any[] | undefined = schema.enum || schema.oneOf;

    if (!items)
      return [];

    return sort(items, x => x.title ?? x).map(x => ({
      text: x.title ?? x,
      value: x.const ?? x,
    }));
  }, [schema.enum, schema.oneOf]);

  const items = getItems();
  // data needs to be converted to SelectItem
  data = data
    .map((val: string) => items.find(it => it.value === val))
    .filter((x: SelectItem) => x !== undefined);

  return <Autocomplete
    multiple
    id={id}
    options={items}
    isOptionEqualToValue={(option, value) => {
      return option.value === value.value;
    }}
    getOptionLabel={(option) => option?.text ?? option}
    onChange={(_event, value) => handleChange(path, value.map(x => x.value))}
    value={data}
    renderInput={(params) => (
      <TextField
        {...params}
        variant="standard"
        label={label}
        placeholder={description}
      />
    )}
  />
}

export default withJsonFormsControlProps(MultiSelect);