import { PropertyComponent } from "../property_component";
import sharedStyles from '../shared_styles.module.css';
import styles from './array_component.module.css';
import React, { useContext, useEffect, useState } from "react";
import classNames from "classnames";
import { dataContext } from "../../generated/react/outer-data";
import { IoMdAddCircleOutline } from 'react-icons/io';
import { v4 as uuidv4 } from 'uuid';
import { addChangeListener, HEADER_HEIGHT, MUTATE_ACTION, MUTATE_OBJECT_TYPE, protoFieldTypes, removeChangeListener } from "../../pages/_app";
import { ObjectHeaderComponent } from "./object_header_component";
import { ObjectRowComponent } from "./object_row_component";
import rowStyles from './object_row_component.module.css';
import { BsCheckLg } from "react-icons/bs";

export function ArrayComponent({
    title,
    array,
    typeInfo,
    headerDepth,
}: {
    title: string,
    array: any[],
    typeInfo: any,
    headerDepth: number,
}) {
    const [renderCount, setRenderCount] = useState(0);
    const [selectedItemIndexes, setSelectedItemIndexes] = useState<number[]>([]);
    const [hoveredItemIndexes, setHoveredItemIndexes] = useState<number[]>([]);
    const { functions: { handleChange } } = useContext(dataContext);
    const isPrimitive = typeInfo.kind === 'scalar';

    function toggleArrayElementSelected(event: React.MouseEvent, index: number) {
        event.stopPropagation();
        const arrayIndex = selectedItemIndexes.indexOf(index);
        if (arrayIndex > -1) {
            selectedItemIndexes.splice(arrayIndex, 1);
        } else {
            selectedItemIndexes.push(index);
        }
        selectedItemIndexes.sort();
        setRenderCount(renderCount + 1);
    }

    function toggleArrayElementHovered(event: React.MouseEvent, index: number) {
        event.stopPropagation();
        const arrayIndex = hoveredItemIndexes.indexOf(index);
        if (arrayIndex > -1) {
            hoveredItemIndexes.splice(arrayIndex, 1);
        } else {
            hoveredItemIndexes.push(index);
        }
        hoveredItemIndexes.sort();
        setRenderCount(renderCount + 1);
    }

    useEffect(() => {
        function keyPressed(e: KeyboardEvent) {
            if (selectedItemIndexes.length > 0 && document.activeElement === document.body) {
                if (e.key === "Backspace" || e.key === "Delete") {
                    const items = selectedItemIndexes.map((index) => array[index]);
                    handleChange({
                        array,
                        objectType: MUTATE_OBJECT_TYPE.ARRAY,
                        mutateAction: MUTATE_ACTION.REMOVE,
                        indexes: selectedItemIndexes,
                        items
                    });
                    setSelectedItemIndexes([]);
                } else if (e.key === 'Escape') {
                    setSelectedItemIndexes([]);
                }
            }
        }
        window.addEventListener('keydown', keyPressed);
        return () => {
            window.removeEventListener('keydown', keyPressed);
        }
    }, [array, selectedItemIndexes]);

    useEffect(() => {
        function onCopy(e: ClipboardEvent) {
            if (selectedItemIndexes.length == 0) {
                return
            }
            e.clipboardData?.setData('text/plain', JSON.stringify(selectedItemIndexes.map(i => typeInfo.T().toJson(array[i]))));
            e.preventDefault();
        }
        function onCut(e: ClipboardEvent) {
            if (selectedItemIndexes.length == 0) {
                return
            }
            e.clipboardData?.setData('text/plain', JSON.stringify(selectedItemIndexes.map(i => typeInfo.T().toJson(array[i]))));
            handleChange({
                array,
                objectType: MUTATE_OBJECT_TYPE.ARRAY,
                mutateAction: MUTATE_ACTION.REMOVE,
                indexes: selectedItemIndexes,
                items: selectedItemIndexes.map(i => array[i])
            });
            setSelectedItemIndexes([])
            e.preventDefault();
        }
        function onPaste(e: ClipboardEvent) {
            if (selectedItemIndexes.length == 0) {
                return
            }
            if (e.clipboardData && e.clipboardData.types.indexOf('text/plain') > -1) {
                const data: any[] = JSON.parse(e.clipboardData?.getData('text/plain')).map((e: any) => typeInfo.T().fromJson(e));
                const insertIndex = selectedItemIndexes.reduce((acc, curr) => Math.max(acc, curr), 0);
                handleChange({
                    array,
                    objectType: MUTATE_OBJECT_TYPE.ARRAY,
                    mutateAction: MUTATE_ACTION.ADD,
                    indexes: data.map((_, index) => insertIndex + 1 + index),
                    items: data
                });
                setRenderCount(renderCount + 1);
            }
            e.preventDefault();
        }
        document.addEventListener('copy', onCopy);
        document.addEventListener('cut', onCut);
        document.addEventListener('paste', onPaste);

        return () => {
            document.removeEventListener('copy', onCopy);
            document.removeEventListener('cut', onCut);
            document.removeEventListener('paste', onPaste);

        }
    }, [array, selectedItemIndexes, renderCount]);

    React.useEffect(() => {
        const changeListener = () => {
            setRenderCount(renderCount + 1);
        }
        addChangeListener({ objectType: MUTATE_OBJECT_TYPE.ARRAY, array, listener: changeListener });
        return () => removeChangeListener({ objectType: MUTATE_OBJECT_TYPE.ARRAY, array, listener: changeListener });
    }, [array, renderCount])

    if (!isPrimitive) {
        for (const element of array) {
            if (!element.__CONFIG_INTERNAL_ID__) {
                element.__CONFIG_INTERNAL_ID__ = uuidv4();
            }
        }
    }

    function addArrayElement(e: React.MouseEvent) {
        e.stopPropagation();
        let newItem;
        if (isPrimitive) {
            const itemTypeName = protoFieldTypes[typeInfo.T]
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
            newItem = typeInfo.T().create();
        }
        handleChange({
            array,
            objectType: MUTATE_OBJECT_TYPE.ARRAY,
            mutateAction: MUTATE_ACTION.ADD,
            indexes: [array.length],
            items: [newItem]
        });
        setRenderCount(renderCount + 1);
    }

    const collectionItems = array.map((item, index) => {
        const selected = selectedItemIndexes.includes(index);
        const hovered = hoveredItemIndexes.includes(index);
        if (isPrimitive) {
            return (
                <tr
                    className={classNames(rowStyles.row, { [rowStyles.mouseOver]: hovered, [rowStyles.selected]: selected })}
                    onClick={(e) => toggleArrayElementSelected(e, index)}
                    key={item + "_" + index}
                    onMouseOver={(e) => toggleArrayElementHovered(e, index)}
                    onMouseOut={(e) => toggleArrayElementHovered(e, index)}
                >
                    <td className={classNames(rowStyles.objectNumberInner, rowStyles.cell, rowStyles.cellInternal)}>
                        <div className={rowStyles.objectNumber} style={{ top: headerDepth * HEADER_HEIGHT }}>
                            <div className={rowStyles.checkboxOuter}>
                                <div
                                    className={classNames(sharedStyles.checkbox, {
                                        [sharedStyles.checkboxChecked]: selected,
                                        [sharedStyles.mouseOver]: hovered
                                    })}
                                >
                                    {selected && <BsCheckLg />}
                                    <input type="checkbox" checked={selected} className={sharedStyles.checkboxInput} readOnly ></input>
                                </div>
                            </div>
                        </div>
                    </td>
                    <td className={classNames(rowStyles.cell, rowStyles.cellInternal)} key={index} style={{ top: headerDepth * HEADER_HEIGHT }}>
                        {/* <div className={rowStyles.objectNumberText}>#{index + 1}</div> */}
                        <PropertyComponent parent={array} propertyKey={index} typeInfo={{ ...typeInfo, repeat: 0 }} headerDepth={headerDepth} />
                    </td>
                </tr>
            );
        } else {
            const selected = selectedItemIndexes.includes(index);
            return <ObjectRowComponent key={item.__CONFIG_INTERNAL_ID__} object={item} fields={typeInfo.T().fields} onRowClick={(e) => toggleArrayElementSelected(e, index)} selected={selected} includeIndexColumn={true} headerDepth={headerDepth + 1} />
        }
    });

    return (
        <div className={styles.arrayOuter}>
            {array.length > 0 && <table cellPadding={0} cellSpacing={0} className={classNames(styles.table, { [styles.compact]: isPrimitive })}>
                <tbody>
                    {<ObjectHeaderComponent fields={isPrimitive ? [typeInfo] : typeInfo.T().fields} includeIndexColumn={true} headerDepth={headerDepth} />}
                    {collectionItems}
                </tbody>
            </table>}
            <div className={styles.footer}>
                <button
                    className={sharedStyles.button}
                    onClick={addArrayElement}
                    onMouseOver={e => e.stopPropagation()}
                ><IoMdAddCircleOutline /> Add {title}</button>
                {/* <div className={sharedStyles.divider} /> */}
                <div className={styles.arrayCount}>
                    {array.length} {title}
                </div>
            </div>
        </div>
    )
}