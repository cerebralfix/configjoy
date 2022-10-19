import sharedStyles from '../shared_styles.module.css';
import styles from './array_component.module.css';
import React, { useContext, useEffect, useState } from "react";
import classNames from "classnames";
import { dataContext } from "../../generated/react/outer-data";
import { IoMdAddCircleOutline } from 'react-icons/io';
import { addChangeListener, HEADER_HEIGHT, MUTATE_ACTION, MUTATE_OBJECT_TYPE, protoFieldTypes, removeChangeListener } from "../../pages/_app";
import { ObjectRowComponent } from './object_row_component';

export function MapComponent({
    title,
    map,
    typeInfo,
    headerDepth,
}: {
    title: string,
    map: any,
    typeInfo: any,
    headerDepth: number,
}) {
    const [renderCount, setRenderCount] = useState(0);
    const [selectedItemKeys, setSelectedItemKeys] = useState<any[]>([]);
    const [originalKeyOrder, setOriginalKeyOrder] = useState<any[]>([]);
    const [mouseOverItemIndex, setMouseOverItemIndex] = useState<number | undefined>(undefined);
    const { functions: { handleChange } } = useContext(dataContext);

    function toggleArrayElementSelected(event: React.MouseEvent, key: string) {
        event.stopPropagation();
        const arrayIndex = selectedItemKeys.indexOf(key);
        if (arrayIndex > -1) {
            selectedItemKeys.splice(arrayIndex, 1);
        } else {
            selectedItemKeys.push(key);
        }
        selectedItemKeys.sort();
        setRenderCount(renderCount + 1);
    }

    useEffect(() => {
        function keyPressed(e: KeyboardEvent) {
            if (selectedItemKeys.length > 0) {
                if (e.key === "Backspace" || e.key === "Delete") {
                    handleChange({
                        object: map,
                        objectType: MUTATE_OBJECT_TYPE.OBJECT,
                        mutateAction: MUTATE_ACTION.DELETE_KEYS,
                        keys: selectedItemKeys,
                        oldValues: Object.entries(map).filter(([key, _]) => selectedItemKeys.includes(key)).map(([_, value]) => value),
                    });
                    setSelectedItemKeys([]);
                } else if (e.key === 'Escape') {
                    setSelectedItemKeys([]);
                }
            }
        }
        window.addEventListener('keydown', keyPressed);
        return () => {
            window.removeEventListener('keydown', keyPressed);
        }
    }, [map, selectedItemKeys]);

    function addMapElement(e: React.MouseEvent) {
        e.stopPropagation();
        let newItem;
        if (typeInfo.V.kind === 'scalar') {
            const itemTypeName = protoFieldTypes[typeInfo.V.T]
            switch (itemTypeName) {
                case "double":
                case "float":
                case "int64":
                case "uint64":
                case "int32":
                case "uint32":
                case "fixed64":
                case "fixed32": {
                    newItem = 0;
                    break;
                }
                case "string": {
                    newItem = '';
                    break;
                }
                case "bool": {
                    newItem = true;
                    break;
                }
                case "enum": {
                    newItem = 0;
                    break;
                }
                case ".google.protobuf.Timestamp": {
                    newItem = (new Date());
                    break;
                }
            }
        } else {
            newItem = typeInfo.V.T().create();
        }
        handleChange({
            object: map,
            objectType: MUTATE_OBJECT_TYPE.OBJECT,
            mutateAction: MUTATE_ACTION.MODIFY,
            keys: [protoFieldTypes[typeInfo.K] === 'string' ? '' : -1],
            values: [undefined],
            newValues: [newItem]
        });
        setRenderCount(renderCount + 1);
    }

    React.useEffect(() => {
        const changeListener = () => {
            setRenderCount(renderCount + 1);
        }
        addChangeListener({ objectType: MUTATE_OBJECT_TYPE.OBJECT, object: map, listener: changeListener });
        return () => removeChangeListener({ objectType: MUTATE_OBJECT_TYPE.OBJECT, object: map, listener: changeListener });
    }, [renderCount])

    const collectionItems = Object.entries(map).map(([key, value], index) => {
        const selected = selectedItemKeys.includes(key);
        const fields = [
            { kind: 'scalar', T: typeInfo.K, mapKey: true, jsonName: key },
            { ...typeInfo.V, jsonName: key },
        ]
        return (
            <ObjectRowComponent key={key + "_" + index} object={map} fields={fields} onRowClick={(e) => toggleArrayElementSelected(e, key)} selected={selected} includeIndexColumn={true} headerDepth={headerDepth + 1} />
        );
    });

    return (
        <div className={classNames(styles.arrayOuter)}>
            {Object.entries(map).length > 0 && <table className={styles.table}>
                <tbody>
                    {collectionItems}
                </tbody>
            </table>}
            <button
                className={sharedStyles.button}
                onClick={addMapElement}
                onMouseOver={e => e.stopPropagation()}
            ><IoMdAddCircleOutline /> Add {title}</button>
        </div>
    )
}