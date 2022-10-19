import * as React from 'react';
import { ArrayComponent } from './collections/array_component';
import { StringInputComponent } from './inputs/string_input_component';
import styles from "./property_component.module.css";
import sharedStyles from "./shared_styles.module.css";
import { BooleanComponent } from './inputs/boolean_component';
import { DateTimeComponent } from './inputs/date_time_component';
import classNames from 'classnames';
import { EnumComponent } from './inputs/enum_component';
import { ObjectNullableComponent } from './collections/object_nullable_component';
import { BiCaretDown, BiCaretUp } from 'react-icons/bi';
import { AiFillEyeInvisible } from 'react-icons/ai';
import { HEADER_HEIGHT, protoFieldTypes } from '../pages/_app';
import { MapComponent } from './collections/map_component';
import { ObjectHeaderComponent } from './collections/object_header_component';
import { ObjectRowComponent } from './collections/object_row_component';

export function splitAndCapitalise(toSplit: string) {
    const capitalized = toSplit.slice(0, 1).toUpperCase() + toSplit.slice(1);
    return capitalized.split(/(?=[A-Z])/).join(' ');
}

export function splitUnderscoreAndCapitalise(toSplit: string) {
    const capitalized = toSplit.slice(0, 1).toUpperCase() + toSplit.slice(1);
    return capitalized.split(/_/).join(' ');
}

export function PropertyComponent({
    parent,
    propertyKey,
    typeInfo,
    compact = false,
    topLevel = false,
    collapseOverride = false,
    displayPropertyName = false,
    headerDepth,
}: {
    parent: any,
    propertyKey: any,
    typeInfo: any,
    compact?: boolean,
    topLevel?: boolean,
    collapseOverride?: boolean,
    displayPropertyName?: boolean,
    headerDepth: number,
}) {
    const [collapsed, setCollapsed] = React.useState(false);
    const [mouseOver, setMouseOver] = React.useState(false);

    const isPrimitive = typeInfo.kind === 'scalar';
    const isArray = typeInfo.repeat === 1;
    const property = parent[propertyKey];
    let typeName = '';
    if (isPrimitive) {
        typeName = protoFieldTypes[typeInfo.T]
    } else if (typeInfo.kind === 'map') {
        typeName = `Map<${protoFieldTypes[typeInfo.K]}, ${protoFieldTypes[typeInfo.V.T]}>`;
    } else {
        const typeNameSplit = (typeInfo.T().typeName || '').split('.');
        typeName = typeNameSplit[typeNameSplit.length - 1];
    }

    let component: React.ReactNode = null;
    if (isArray) {
        component = component = <ArrayComponent
            title={propertyKey}
            array={property}
            typeInfo={typeInfo}
            headerDepth={headerDepth}
        />;
    } else {
        if (isPrimitive) {
            switch (typeName) {
                case "double":
                case "float":
                case "int64":
                case "uint64":
                case "int32":
                case "uint32":
                case "fixed64":
                case "fixed32":
                case "string": {
                    component = <StringInputComponent parent={parent} propertyKey={propertyKey} typeName={typeName} />; break;
                }
                case "bool": {
                    component = <BooleanComponent parent={parent} propertyKey={propertyKey} />; break;
                }
            }
        } else {
            if (typeInfo.kind === 'enum') {
                component = <EnumComponent parent={parent} propertyKey={propertyKey} typeInfo={typeInfo.T()} />;
            } else if (typeInfo.kind === 'map') {
                component = <MapComponent title={propertyKey} map={property} typeInfo={typeInfo} headerDepth={headerDepth} />;
            } else if (typeInfo.T().typeName === 'google.protobuf.Timestamp') {
                component = <DateTimeComponent parent={parent} propertyKey={propertyKey} />;
            } else {
                component = !parent[propertyKey] ? <ObjectNullableComponent
                    parent={parent}
                    propertyKey={propertyKey}
                    typeInfo={typeInfo.T()}
                /> : (
                    <table cellPadding={0} cellSpacing={0} className={styles.innerTable} style={{ width: '100%' }}>
                        <tbody>
                            <ObjectHeaderComponent headerDepth={headerDepth} fields={typeInfo.T().fields} includeIndexColumn={false} sticky={false} />
                            <ObjectRowComponent object={parent[propertyKey]} headerDepth={headerDepth} fields={typeInfo.T().fields} onRowClick={() => void 0} selected={false} includeIndexColumn={false} />
                        </tbody>
                    </table>
                );
            }
        }
    }

    const collapsedIndicator = (
        <button
            className={sharedStyles.button}
            onClick={e => { setCollapsed(false); e.stopPropagation(); }}
        >
            <AiFillEyeInvisible />
            {(isArray ? ` ${property.length} hidden ${splitAndCapitalise(propertyKey)}` : '')}
        </button>
    );

    return compact ?
        (
            <div
                className={classNames(styles.propertyOuter, styles.compact)}
                onMouseOver={(e) => { e.stopPropagation(); setMouseOver(true); }}
                onMouseOut={(e) => { e.stopPropagation(); setMouseOver(false); }}
            >
                {component}
            </div>
        )
        :
        (
            <div className={classNames(styles.propertyInner, { [styles.topLevel]: topLevel, [styles.oneof]: typeInfo.oneof })} style={{ top: (headerDepth) * HEADER_HEIGHT }} >
                {(collapsed || collapseOverride) ? <div style={{ display: 'none' }}>{component}</div> : component}
                {(collapsed || collapseOverride) && collapsedIndicator}
            </div>
        );
}