import * as React from 'react';

import { dataContext, dataObjects } from '../generated/react/outer-data';
import styles from "./outer_component.module.css";
import classNames from 'classnames';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ObjectHeaderComponent } from './collections/object_header_component';
import { ObjectRowComponent } from './collections/object_row_component';

export function AppOuter() {
    const { data: { data } } = React.useContext(dataContext)
    const { pathname } = useRouter();

    const buttons = dataObjects.map((dataObject, index) => {
        const path = `/generated/${dataObject}`;
        const title = dataObject.slice(0, 1).toUpperCase() + dataObject.slice(1);
        return (
            <Link href={path} key={index}>
                <a className={classNames(styles.tabButton, { [styles.tabButtonHighlighted]: pathname === path })} >
                    {title}
                </a>
            </Link>
        )
    });

    const fields: any[] = data[Object.getOwnPropertySymbols(data)[0]].fields;
    const components = fields.map((field, index) => (
        <table cellPadding={0} cellSpacing={0} key={index} >
            <tbody>
                <ObjectHeaderComponent fields={[field]} includeIndexColumn={false} headerDepth={0} sticky={false} unstyled />
                <ObjectRowComponent object={data} fields={[field]} onRowClick={() => void 0} selected={false} includeIndexColumn={false} headerDepth={0} />
            </tbody>
        </table>
    ));

    return (
        <div className={styles.container}>
            <div className={styles.tabBar}>
                {buttons}
            </div>
            <div className={styles.containerInner}>
                {/* <input type="text" placeholder={`Search...`} className={styles.searchBar}></input> */}
                <div className={styles.flexInner}>
                    {components}
                </div>
            </div>
        </div>
    );
}