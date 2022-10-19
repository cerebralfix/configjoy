import classNames from 'classnames';
import * as React from 'react';
import { HEADER_HEIGHT, protoFieldTypes } from "../../pages/_app";
import { splitAndCapitalise } from '../property_component';
import styles from './object_header_component.module.css';
import sharedStyles from '../shared_styles.module.css';

export function ObjectHeaderComponent({
    fields,
    includeIndexColumn,
    headerDepth,
    sticky = true,
    unstyled = false,
}: {
    fields: any[],
    includeIndexColumn: boolean,
    headerDepth: number,
    sticky?: boolean
    unstyled?: boolean
}) {
    const renderedOneOfs: string[] = []
    const titles = fields.map((field, index) => {
        if (field.oneof) {
            if (!renderedOneOfs.includes(field.oneof)) {
                renderedOneOfs.push(field.oneof)
            } else {
                return;
            }
        }
        const isPrimitive = field.kind === 'scalar';
        const isArray = field.repeat === 1;
        let typeName = '';
        if (isPrimitive) {
            typeName = protoFieldTypes[field.T]
        } else if (field.kind === 'map') {
            typeName = `Map<${protoFieldTypes[field.K]}, ${protoFieldTypes[field.V.T]}>`;
        } else if (field.oneof) {
            typeName = field.oneof;
        } else {
            const typeNameSplit = (field.T().typeName || '').split('.');
            typeName = typeNameSplit[typeNameSplit.length - 1];
        }
        return (
            <React.Fragment key={index}>
                <th className={classNames({ [styles.cell]: !unstyled, [styles.sticky]: sticky, [styles.topPadding]: unstyled })} style={{ top: headerDepth * HEADER_HEIGHT }}>
                    <div className={styles.propertyTitle}>
                        {splitAndCapitalise(field.oneof || field.jsonName)}
                        {/* {!collapseOverride && isArray && <button className={sharedStyles.subtleButton} onClick={(e) => { setCollapsed(!collapsed); e.stopPropagation(); }}>{collapsed ? <BiCaretUp /> : <BiCaretDown />}</button>} */}
                        <span className={sharedStyles.divider} style={{ minWidth: 40 }} />
                        <span className={classNames(styles.propertyType, styles[typeName])}>{typeName}{isArray && '[]'}</span>
                    </div>
                </th>
                {field.oneof && <th className={classNames(styles.cell, { [styles.sticky]: sticky })} key={index} style={{ top: headerDepth * HEADER_HEIGHT }} />}
            </React.Fragment>
        );
    });

    return (
        <tr className={styles.rowHeader}>
            {includeIndexColumn && (
                <th className={classNames(styles.cell, { [styles.sticky]: sticky })} style={{ top: headerDepth * HEADER_HEIGHT }}>
                    <div className={styles.objectNumberText}>#</div>
                </th>
            )}
            {titles}
        </tr>
    )
}