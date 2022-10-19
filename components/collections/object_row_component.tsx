import classNames from 'classnames';
import * as React from 'react';
import { PropertyComponent } from '../property_component';
import styles from './object_row_component.module.css';
import sharedStyles from '../shared_styles.module.css';
import propertyStyles from '../property_component.module.css';
import { BsCheckLg } from 'react-icons/bs';
import { HEADER_HEIGHT, MUTATE_ACTION, MUTATE_OBJECT_TYPE } from '../../pages/_app';
import { dataContext } from '../../generated/react/outer-data';
import { MapKeyInput } from './map_key_input';

export function ObjectRowComponent({
    object,
    fields,
    onRowClick,
    selected = false,
    includeIndexColumn,
    headerDepth,
}: {
    object: any,
    fields: any[],
    onRowClick: (event: React.MouseEvent) => void,
    selected?: boolean,
    includeIndexColumn: boolean,
    headerDepth: number,
}) {
    const [mouseOver, setMouseOver] = React.useState(false);
    const [renderCount, setRenderCount] = React.useState(0);
    const { functions: { handleChange } } = React.useContext(dataContext);

    function onOneOfChange(propertyKey: string, newOneof?: string) {
        if (newOneof && object[propertyKey][newOneof]) {
            return;
        }
        const oneof = object[propertyKey].oneofKind;
        const oneOfs: string[] = fields.map((t: any) => t.jsonName);
        console.log(fields);
        const change = {
            object: object[propertyKey],
            objectType: MUTATE_OBJECT_TYPE.OBJECT,
            mutateAction: MUTATE_ACTION.MODIFY,
            keys: oneOfs.concat('oneofKind'),
            values: oneOfs.map(k => object[propertyKey][k]).concat(oneof),
            newValues: oneOfs.map((k, index) => k === newOneof ? fields[index].kind === 'enum' ? 0 : fields[index].T().create() : undefined).concat(newOneof)
        };
        handleChange(change as any);
        setRenderCount(renderCount + 1);
    }

    const renderedOneOfs: string[] = []
    const collectionItems = fields.map((field, index) => {
        if (field.oneof) {
            const oneof = object[field.oneof].oneofKind;
            if ((oneof && oneof != field.jsonName) || renderedOneOfs.includes(field.oneof)) {
                return null;
            }
            renderedOneOfs.push(field.oneof)
            const oneOfs: string[] = fields.filter(f => f.oneof === field.oneof).map((t: any) => t.jsonName);
            const oneofSelector = (
                <div className={propertyStyles.propertyInner} style={{ top: headerDepth * HEADER_HEIGHT }}>
                    <select
                        onChange={(e) => onOneOfChange(field.oneof, e.target.value === 'None' ? undefined : e.target.value)}
                        className={sharedStyles.textInput}
                        value={oneof || 'None'}
                        onClick={e => e.stopPropagation()}
                    >
                        {[<option key={'undefined'} value={'None'}>{'None'}</option>].concat(oneOfs.map(o => <option key={o} value={o}>{o}</option>))}
                    </select>
                </div>
            );

            return (
                <React.Fragment key={index}>
                    <td className={classNames(styles.cell, styles.cellInternal)}>
                        {oneofSelector}
                    </td>
                    <td className={classNames(styles.cell, styles.cellInternal)}>{oneof &&
                        <PropertyComponent
                            parent={object[field.oneof]}
                            propertyKey={oneof}
                            typeInfo={field}
                            headerDepth={headerDepth}
                        />
                    }</td>
                </React.Fragment>
            )
        } else if (field.mapKey) {
            return (
                <td className={classNames(styles.cell, styles.cellInternal)} key={index} style={{ top: headerDepth * HEADER_HEIGHT }}>
                    <MapKeyInput parent={object} propertyKey={field.jsonName} typeInfo={field} onKeyChange={() => { }} />
                </td>
            )
        }

        return (
            <td className={classNames(styles.cell, styles.cellInternal)} key={index} style={{ top: headerDepth * HEADER_HEIGHT }}>
                <PropertyComponent
                    parent={object}
                    propertyKey={field.jsonName}
                    typeInfo={field}
                    key={index}
                    collapseOverride={false}
                    headerDepth={headerDepth}
                />
            </td>
        );
    });

    return (
        <tr
            onClick={onRowClick}
            className={classNames(styles.row, { [styles.mouseOver]: mouseOver, [styles.selected]: selected })}
            onMouseOver={(e) => { e.stopPropagation(); setMouseOver(true); }}
            onMouseOut={(e) => { e.stopPropagation(); setMouseOver(false); }}
        >
            {includeIndexColumn && (
                <td className={classNames(styles.objectNumberInner, styles.cell, styles.cellInternal)}>
                    <div className={styles.objectNumber} style={{ top: headerDepth * HEADER_HEIGHT }}>
                        {/* <div className={styles.objectNumberText}>#{index + 1}</div> */}

                        <div className={styles.checkboxOuter}>
                            <div
                                className={classNames(sharedStyles.checkbox, {
                                    [sharedStyles.checkboxChecked]: selected,
                                    [sharedStyles.mouseOver]: mouseOver
                                })}
                            >
                                {selected && <BsCheckLg />}
                                <input type="checkbox" checked={selected} className={sharedStyles.checkboxInput} readOnly ></input>
                            </div>
                        </div>
                    </div>
                </td>
            )}
            {collectionItems}
        </tr>
    );
}