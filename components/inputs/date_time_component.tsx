import classNames from 'classnames';
import * as React from 'react';
import { dataContext } from '../../generated/react/outer-data';
import { addChangeListener, MUTATE_ACTION, MUTATE_OBJECT_TYPE, removeChangeListener } from '../../pages/_app';
import sharedStyles from '../shared_styles.module.css';
import { DateTime } from 'luxon';
import { Timestamp } from '../../typescript/google/protobuf/timestamp';

export function DateTimeComponent({ parent, propertyKey }: { parent: any, propertyKey: any }) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [internalState, setInternalState] = React.useState(DateTime.fromISO((parent[propertyKey] ? Timestamp.toDate(parent[propertyKey]) : new Date()).toISOString()).setZone('system'));
    const [mouseOver, setMouseOver] = React.useState(false);
    const { functions: { handleChange } } = React.useContext(dataContext);

    function saveData(ev: React.ChangeEvent<HTMLInputElement>) {
        if (!ev.target['validity'].valid) return;
        const newValue = DateTime.fromISO(ev.target.value).setZone('system');
        if (parent[propertyKey] && Timestamp.toDate(parent[propertyKey]) && newValue.toISO() == DateTime.fromISO(Timestamp.toDate(parent[propertyKey]).toISOString()).setZone('utc').toISO()) {
            return;
        }
        setInternalState(newValue);
        handleChange({
            objectType: MUTATE_OBJECT_TYPE.OBJECT,
            mutateAction: MUTATE_ACTION.MODIFY,
            object: parent,
            keys: [propertyKey],
            values: [parent[propertyKey]],
            newValues: [Timestamp.fromDate(new Date(newValue.toISO()))],
        });
    }

    React.useEffect(() => {
        const changeListener = () => {
            setInternalState(DateTime.fromISO(Timestamp.toDate(parent[propertyKey]).toISOString()).setZone('system'))
            inputRef.current?.focus();
        }
        addChangeListener({ objectType: MUTATE_OBJECT_TYPE.OBJECT, object: parent, key: propertyKey, listener: changeListener });
        return () => removeChangeListener({ objectType: MUTATE_OBJECT_TYPE.OBJECT, object: parent, key: propertyKey, listener: changeListener });
    }, [parent, propertyKey])

    return (
        <input
            type="datetime-local"
            value={internalState.toISO().substring(0, 16)}
            onChange={(e) => saveData(e)}
            className={classNames(sharedStyles.textInput, { [sharedStyles.mouseOver]: mouseOver })}
            onMouseOver={(e) => { e.stopPropagation(); setMouseOver(true); }}
            onMouseOut={(e) => { e.stopPropagation(); setMouseOver(false); }}
            onClick={e => e.stopPropagation()}
            ref={inputRef}
        />
    )
}