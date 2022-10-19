import * as React from 'react';
import { dataContext } from '../../generated/react/outer-data';
import { ObjectComponent } from './object_component';
import sharedStyles from '../shared_styles.module.css';
import { addChangeListener, MUTATE_ACTION, MUTATE_OBJECT_TYPE, removeChangeListener } from '../../pages/_app';
import { IoMdAddCircleOutline } from 'react-icons/io';

export function ObjectNullableComponent({
    parent,
    propertyKey,
    typeInfo
}: {
    parent: any,
    propertyKey: string,
    typeInfo: any,
}) {
    const [renderCount, setRenderCount] = React.useState(0);
    const { functions: { handleChange } } = React.useContext(dataContext);

    function addNewObject(e: React.MouseEvent) {
        e.stopPropagation();
        handleChange({
            objectType: MUTATE_OBJECT_TYPE.OBJECT,
            mutateAction: MUTATE_ACTION.MODIFY,
            object: parent,
            keys: [propertyKey],
            values: [parent[propertyKey]],
            newValues: [typeInfo.create()],
        });
        setRenderCount(renderCount + 1);
    }

    React.useEffect(() => {
        const changeListener = () => {
            setRenderCount(renderCount + 1);
        }
        addChangeListener({ objectType: MUTATE_OBJECT_TYPE.OBJECT, object: parent, key: propertyKey, listener: changeListener });
        return () => removeChangeListener({ objectType: MUTATE_OBJECT_TYPE.OBJECT, object: parent, key: propertyKey, listener: changeListener });
    }, [parent, propertyKey, renderCount])

    return (
        <button
            className={sharedStyles.button}
            onClick={(e) => addNewObject(e)}
            onMouseOver={e => e.stopPropagation()}
            onMouseOut={e => e.stopPropagation()}
        >
            <IoMdAddCircleOutline /> Add {propertyKey}</button>
    )
}