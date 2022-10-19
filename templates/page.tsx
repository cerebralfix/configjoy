import type { NextPage } from 'next'
import Head from 'next/head'
import { AppOuter } from '../../components/outer_component'
import { __MESSAGE_NAME__ as MessageDefinition } from '../../generated/typescript/src/__ROOT_MESSAGE_NAME__';
import { handleChangeWithHistory, Change } from '../_app';
import { dataContext } from '../../generated/react/outer-data';
import { useEffect } from 'react';
import { globalChangeListeners } from '../_app';

async function postData(url = '', data = {}) {
    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(data)
    });
    return response.json();
}

const Home: NextPage<{ data: any }> = (props: { data: any }) => {
    const data = MessageDefinition.fromJson(props.data.data);

    function postDataInternal() {
        postData("/api/write", { messageName: "__ROOT_MESSAGE_NAME_WITH_EXTENSION__", data: MessageDefinition.toJson(data) });
    }

    useEffect(() => {
        globalChangeListeners.add(postDataInternal);
    }, []);

    return (
        <>
            <Head>
                <title>__ROOT_MESSAGE_NAME_WITH_EXTENSION__ | configjoy</title>
                <meta name="description" content="Configure game config data generated by proto files" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <dataContext.Provider value={{
                data: {
                    data,
                },
                functions: {
                    handleChange: (change: Change) => {
                        handleChangeWithHistory(change);
                        postDataInternal();
                    }
                }
            }}>
                <AppOuter />
            </dataContext.Provider>
        </>
    )
}

export async function getServerSideProps() {
    const res = await fetch('http://localhost:__PORT__/api/read?messageName=__ROOT_MESSAGE_NAME_WITH_EXTENSION__');
    const data = await res.json();

    return {
        props: {
            data: data.data
        }
    }
}

export default Home
