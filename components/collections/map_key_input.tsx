import classNames from 'classnames';
import * as React from 'react';
import { dataContext } from '../../generated/react/outer-data';
import { PropertyComponent, splitAndCapitalise } from '../property_component';
import sharedStyles from '../shared_styles.module.css';
import propertyStyles from '../property_component.module.css';
import { Change, MUTATE_ACTION, MUTATE_OBJECT_TYPE, protoFieldTypes } from '../../pages/_app';

export function MapKeyInput({ parent, propertyKey, typeInfo, onKeyChange }: { parent: any, propertyKey: string, typeInfo: any, onKeyChange: () => void }) {
    const [internalValue, setInternalValue] = React.useState(propertyKey);
    const [mouseOver, setMouseOver] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const { functions: { handleChange } } = React.useContext(dataContext);

    function onMapKeyChange() {
        if (internalValue === propertyKey) {
            return;
        }

        let newKey;
        switch (protoFieldTypes[typeInfo.T]) {
            case ("double"):
            case ("float"): {
                newKey = parseFloat(internalValue);
                if (isNaN(newKey)) {
                    return;
                }
                break;
            }
            case ("int64"):
            case ("uint64"):
            case ("int32"):
            case "uint32": {
                newKey = parseInt(internalValue);
                if (isNaN(newKey)) {
                    return;
                }
                break;
            }
            case 'string': {
                newKey = internalValue;
            }
        }

        const change = {
            object: parent,
            objectType: MUTATE_OBJECT_TYPE.OBJECT,
            mutateAction: MUTATE_ACTION.RENAME_KEY,
            fromKey: propertyKey,
            toKey: newKey,
        };
        handleChange(change as Change);
        onKeyChange();
    }


    return (
        <div className={propertyStyles.propertyInner}>
            <input
                type="text"
                placeholder={propertyKey}
                value={internalValue}
                onChange={(e) => setInternalValue(e.target.value)}
                onBlur={onMapKeyChange}
                className={classNames(sharedStyles.textInput, { [sharedStyles.mouseOver]: mouseOver })}
                ref={inputRef}
                onKeyDown={e => { e.key === "Enter" && inputRef.current?.blur(); }}
                onClick={e => e.stopPropagation()}
                onMouseOver={(e) => { e.stopPropagation(); setMouseOver(true); }}
                onMouseOut={(e) => { e.stopPropagation(); setMouseOver(false); }}
            />
        </div>
    )
}