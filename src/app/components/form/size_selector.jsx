import { useEffect } from "preact/hooks";
import { useLocalStorageState } from "/app/hooks/use_local_storage_state.js";

export const SizeSelector = ({
  name,
  onChange,
  min = "0",
  max = "300",
  ...props
}) => {
  const [size, sizeSetter] = useLocalStorageState(name, "auto");
  const [sizeAsNumber, sizeAsNumberSetter] = useLocalStorageState(
    `${name}_number`,
    0,
  );

  useEffect(() => {
    onChange(size);
  }, []);

  return (
    <fieldset {...props}>
      <legend>{name}</legend>
      <label>
        <label>
          <input
            name={name}
            type="radio"
            checked={size === "auto"}
            onInput={(e) => {
              if (e.target.checked) {
                sizeSetter("auto");
                onChange("auto");
              }
            }}
          />
          Auto
        </label>
        <label>
          <input
            name={name}
            type="radio"
            checked={size !== "auto"}
            onInput={(e) => {
              if (e.target.checked) {
                sizeSetter(sizeAsNumber);
                onChange(sizeAsNumber);
              }
            }}
          />
          Number
          <input
            type="number"
            min={min}
            max={max}
            value={sizeAsNumber}
            onInput={(e) => {
              const newSize = e.target.valueAsNumber;
              if (size !== "auto") {
                onChange(newSize);
              }
              sizeAsNumberSetter(newSize);
            }}
          />
        </label>
      </label>
    </fieldset>
  );
};
