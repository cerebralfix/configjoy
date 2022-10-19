import classNames from 'classnames';
import * as React from 'react';
import { dataContext } from '../../generated/react/outer-data';
import sharedStyles from '../shared_styles.module.css';
import { BsCheckLg } from 'react-icons/bs';
import { addChangeListener, MUTATE_ACTION, MUTATE_OBJECT_TYPE, removeChangeListener } from '../../pages/_app';

export function BooleanComponent({ parent, propertyKey }: { parent: any, propertyKey: any }) {
    const [internalValue, setInternalValue] = React.useState(parent[propertyKey] || false);
    const [mouseOver, setMouseOver] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const { functions: { handleChange } } = React.useContext(dataContext);

    function saveData(newValue: boolean) {
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
            setInternalValue(parent[propertyKey])
            inputRef.current?.focus();
        }
        addChangeListener({ objectType: MUTATE_OBJECT_TYPE.OBJECT, object: parent, key: propertyKey, listener: changeListener });
        return () => removeChangeListener({ objectType: MUTATE_OBJECT_TYPE.OBJECT, object: parent, key: propertyKey, listener: changeListener });
    }, [parent, propertyKey])

    return (
        <div className={sharedStyles.checkboxOuter} style={{ width: '100%' }}>
            <label
                className={classNames(sharedStyles.checkbox, sharedStyles.checkboxMinimal, {
                    [sharedStyles.checkboxChecked]: parent[propertyKey],
                    [sharedStyles.mouseOver]: mouseOver
                })}
                onClick={e => e.stopPropagation()}
                onMouseOver={(e) => { e.stopPropagation(); setMouseOver(true); }}
                onMouseOut={(e) => { e.stopPropagation(); setMouseOver(false); }}
            >
                {parent[propertyKey] && <BsCheckLg />}
                <input
                    type="checkbox"
                    checked={internalValue}
                    onChange={(e) => saveData(e.target.checked)}
                    className={sharedStyles.checkboxInput}
                />
            </label>
        </div>
    )
}