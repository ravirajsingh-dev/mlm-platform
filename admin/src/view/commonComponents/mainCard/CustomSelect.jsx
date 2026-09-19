import React from "react";
import Select from "react-select";

const CustomSelect = ({
  isDisabled = false,
  isLoading = false,
  isSearchable = true,
  isClearable = true,
  isRtl = false,
  isCustomLabel = false,
  selectedValue,
  options,
  defaultValue,
}) => {
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      padding: "5px 0",
      background: "#eceff1",
      color: "#212529bf",
    }),
    // option: (provided, state) => ({
    //   ...provided,
    //   color: "#212529bf",
    //   background: "#eceff1",
    // }),
    // singleValue: (provided, state) => ({
    //   ...provided,
    //   color: "#212529bf",
    // }),
    // placeholder: (provided, state) => ({
    //   ...provided,
    //   color: "#212529bf",
    // }),
    // input: (provided, state) => ({
    //   ...provided,
    //   color: "#212529bf",
    // }),
    // dropdownIndicator: (provided, state) => ({
    //   ...provided,
    //   color: "#212529bf",
    // }),
    // clearIndicator: (provided, state) => ({
    //   ...provided,
    //   color: "#212529bf",
    //   cursor: "pointer",
    // }),
  };

  const handleChange = (selectedOption) => {
    selectedValue(selectedOption);
  };

  const transformedOptions = isCustomLabel
    ? options.map((option) => ({
        ...option,
        label: `${option.label} (${option.phoneCode}) (${option.abbreviation})`,
      }))
    : options;

  return (
    <Select
      className="basic-single"
      classNamePrefix="select"
      defaultValue={defaultValue}
      value={options.find((option) => option.value === defaultValue)}
      isDisabled={isDisabled}
      isLoading={isLoading}
      isClearable={isClearable}
      isRtl={isRtl}
      isSearchable={isSearchable}
      options={transformedOptions}
      styles={customStyles}
      onChange={handleChange}
    />
  );
};

export default CustomSelect;
