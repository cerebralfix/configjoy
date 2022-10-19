import classNames from 'classnames';
import * as React from 'react';
import { dataContext } from '../../generated/react/outer-data';
import { addChangeListener, MUTATE_ACTION, MUTATE_OBJECT_TYPE, removeChangeListener } from '../../pages/_app';
import sharedStyles from '../shared_styles.module.css';

export function EnumComponent({
    parent,
    propertyKey,
    typeInfo
}: {
    parent: any,
    propertyKey: any,
    typeInfo: any
}) {
    const [internalValue, setInternalValue] = React.useState(parent[propertyKey] || 0);
    const [mouseOver, setMouseOver] = React.useState(false);
    const inputRef = React.useRef<HTMLSelectElement>(null);
    const { functions: { handleChange } } = React.useContext(dataContext);

    function saveData(e: React.ChangeEvent<HTMLSelectElement>) {
        const newValue = parseInt(e.target.value, 10);
        setInternalValue(newValue);
        handleChange({
            objectType: MUTATE_OBJECT_TYPE.OBJECT,
            mutateAction: MUTATE_ACTION.MODIFY,
            object: parent,
            keys: [propertyKey],
            values: [parent[propertyKey]],
            newValues: [newValue],
        });
    }


    React.useEffect(() => {
        const changeListener = () => {
            setInternalValue(parent[propertyKey]);
            inputRef.current?.focus();
        }
        addChangeListener({ objectType: MUTATE_OBJECT_TYPE.OBJECT, object: parent, key: propertyKey, listener: changeListener });
        return () => removeChangeListener({ objectType: MUTATE_OBJECT_TYPE.OBJECT, object: parent, key: propertyKey, listener: changeListener });
    }, [parent, propertyKey])

    return (
        <select
            value={internalValue}
            onChange={(e) => saveData(e)}
            className={classNames(sharedStyles.textInput, { [sharedStyles.mouseOver]: mouseOver })}
            onClick={(e) => e.stopPropagation()}
            onMouseOver={(e) => { e.stopPropagation(); setMouseOver(true); }}
            onMouseOut={(e) => { e.stopPropagation(); setMouseOver(false); }}
            autoComplete="off"
            ref={inputRef}
        >
            {Object.entries(typeInfo[1]).map(([key, value]) => typeof value !== 'number' && <option key={key} value={key}>{value as any}</option>).filter(o => !!o)}
        </select>
    )
}