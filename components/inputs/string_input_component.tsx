import classNames from 'classnames';
import * as React from 'react';
import { dataContext } from '../../generated/react/outer-data';
import { addChangeListener, MUTATE_ACTION, MUTATE_OBJECT_TYPE, removeChangeListener } from '../../pages/_app';
import sharedStyles from '../shared_styles.module.css';

export function StringInputComponent({ parent, propertyKey, typeName }: { parent: any, propertyKey: any, typeName: string }) {
    const [internalValue, setInternalValue] = React.useState((parent[propertyKey] || (typeName === 'string' ? '' : 0)).toString());
    const [mouseOver, setMouseOver] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const { functions: { handleChange } } = React.useContext(dataContext);

    function saveData() {
        let newValue;

        switch (typeName) {
            case ("double"):
            case ("float"): {
                newValue = parseFloat(internalValue);
                if (isNaN(newValue)) {
                    return;
                }
                break;
            }
            case ("int64"):
            case ("uint64"):
            case ("uint32"):
            case ("int32"): {
                newValue = parseInt(internalValue);
                if (isNaN(newValue)) {
                    return;
                }
                break;
            }
            case 'string': {
                newValue = internalValue;
            }
        }

        if (newValue === parent[propertyKey]) {
            return;
        }

        handleChange({
            object: parent,
            objectType: MUTATE_OBJECT_TYPE.OBJECT,
            mutateAction: MUTATE_ACTION.MODIFY,
            keys: [propertyKey],
            values: [parent[propertyKey]],
            newValues: [newValue],
        });
    }

    React.useEffect(() => {
        const changeListener = () => {
            setInternalValue(parent[propertyKey])
            inputRef.current?.focus();
        }
        addChangeListener({ objectType: MUTATE_OBJECT_TYPE.OBJECT, object: parent, key: propertyKey, listener: changeListener });
        return () => removeChangeListener({ objectType: MUTATE_OBJECT_TYPE.OBJECT, object: parent, key: propertyKey, listener: changeListener });
    }, [parent, propertyKey])

    return (
        <input
            type="text"
            placeholder={propertyKey}
            value={internalValue}
            onChange={(e) => setInternalValue(e.target.value)}
            onBlur={saveData}
            className={classNames(sharedStyles.textInput, { [sharedStyles.mouseOver]: mouseOver })}
            ref={inputRef}
            onKeyDown={e => { e.key === "Enter" && inputRef.current?.blur(); }}
            onClick={e => e.stopPropagation()}
            onMouseOver={(e) => { e.stopPropagation(); setMouseOver(true); }}
            onMouseOut={(e) => { e.stopPropagation(); setMouseOver(false); }}
        />
    )
}