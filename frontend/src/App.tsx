import {useEffect, useState} from "react";
import {useIsAuthenticated, useMsal} from "@azure/msal-react";

const env: ImportMetaEnv = await import.meta.env;
const CONSUMER_GROUP_NAME: string = env.VITE_CONSUMER_GROUP_NAME;
const CONSUMER_INSTANCE_NAME: string = env.VITE_CONSUMER_INSTANCE_NAME;
const TOPIC_NAME: string = env.VITE_TOPIC_NAME;
const REGISTER_CONSUMER_INSTANCE_URL= env.VITE_REGISTER_CONSUMER_INSTANCE_URL;
const SUBSCRIBE_TOPIC_URL: string = env.VITE_SUBSCRIBE_TOPIC_URL;
const CONSUME_MESSAGE_URL: string = env.VITE_CONSUME_MESSAGE_URL;
function App() {
    const POLLING_INTERVAL: number = 2000; // Poll every 2 seconds
    const RECREATE_POLLING_INTERVAL: number = 5000; // Poll every 5 seconds
    const headerAccept: string = 'application/json';
    const headerContentType: string = 'application/json';
    const subscribeUrl: string = SUBSCRIBE_TOPIC_URL.concat("?group_name=").concat(CONSUMER_GROUP_NAME).concat("&instance_name=").concat(CONSUMER_INSTANCE_NAME);
    const consumeMessageUrl: string = CONSUME_MESSAGE_URL.concat("?group_name=").concat(CONSUMER_GROUP_NAME).concat("&instance_name=").concat(CONSUMER_INSTANCE_NAME);
    const [isEnableConsume, setIsEnableConsume] = useState(false);
    const [output, setOutput] = useState<Array<string> | []>([])
    const isAuthenticated = useIsAuthenticated();
    const {instance, accounts, inProgress} = useMsal();


    useEffect(() => {
        const fetchData = async (): Promise<void> => {
            if (isEnableConsume) {
                try {
                    const token: string = await acquireToken();
                    const response = await fetch(consumeMessageUrl, {
                        headers: {
                            'Accept': headerAccept,
                            'Content-Type': headerContentType,
                            'Authorization': 'Bearer ' + token
                        }
                    });
                    const result = await response.json();
                    if (result.error_code || result.error_code === 40403) {
                        setIsEnableConsume(false);
                        console.error('Error fetching data: Trying to re-create the consumer instance', result);
                        return;
                    } else {
                        if (result.data[0]) {
                            if (output.length === 0) {
                                setOutput([result.data[0].value]);
                            } else {
                                setOutput([...output, result.data[0].value]);
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            }
        };

        fetchData(); // Fetch immediately on mount
        const intervalId: number = setInterval(fetchData, POLLING_INTERVAL); // Set up polling

        return () => clearInterval(intervalId); // Clean up the interval on unmount
    }, [isEnableConsume, output.length, output]); // Empty array ensures this runs only once on mount

    useEffect(() => {
        const reCreateConsumerInstance = async (): Promise<void> => {
            if (!isEnableConsume) {
                const payloadCreateConsumerInstance = {
                    groupName: CONSUMER_GROUP_NAME,
                    name: CONSUMER_INSTANCE_NAME,
                    format: 'json',
                    'auto.offset.reset': 'earliest'
                };
                const token = await acquireToken();
                const response: Promise<void> = fetch(REGISTER_CONSUMER_INSTANCE_URL, {
                    method: 'POST',
                    headers: {
                        'Accept': headerAccept,
                        'Content-Type': headerContentType,
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(payloadCreateConsumerInstance)
                }).then(
                    async (response) => {
                        console.log("LOG RESPONSE create consumer instance: ", response);
                        console.log("is enable consume", isEnableConsume);
                        const token = await acquireToken();
                        if (response.status === 200) {
                            console.log("Consumer instance created successfully");
                            await fetch(subscribeUrl, {
                                method: 'POST',
                                headers: {
                                    'Accept': headerAccept,
                                    'Content-Type': headerContentType,
                                    'Authorization': 'Bearer ' + token
                                },
                                body: JSON.stringify({topics: [TOPIC_NAME,]})
                            }).then(
                                async (response) => {
                                    console.log("LOG RESPONSE subscribe: ", response);
                                    if (response.status === 200) {
                                        console.log("Subscribed to topic successfully");
                                        setIsEnableConsume(true);
                                    } else {
                                        console.error("Error subscribing to topic", response);
                                        setIsEnableConsume(false);
                                    }
                                }
                            );
                        } else {
                            console.error("Error creating consumer instance", response);
                            if (response && response.status === 409) {
                                const token = await acquireToken();
                                console.error("Consumer instance already exists, trying to re-subscribe");
                                const response = await fetch(subscribeUrl, {
                                    method: 'POST',
                                    headers: {
                                        'Accept': headerAccept,
                                        'Content-Type': headerContentType,
                                        'Authorization': 'Bearer ' + token
                                    },
                                    body: JSON.stringify({topics: [TOPIC_NAME,]})
                                }).then(
                                    async (response) => {
                                        console.log("LOG RESPONSE subscribe: ", response);
                                        if (response.status === 204) {
                                            console.log("Subscribed to topic " + TOPIC_NAME + " successfully");
                                            setIsEnableConsume(true);
                                        } else {
                                            console.error("Error subscribing to topic", response);
                                            setIsEnableConsume(false);
                                        }
                                    }
                                );
                            }
                        }
                    }
                );
            }
        }
        if (isAuthenticated) {
            reCreateConsumerInstance(); // Fetch immediately on mount
            const intervalId: number = setInterval(reCreateConsumerInstance, RECREATE_POLLING_INTERVAL); // Set up polling

            return () => clearInterval(intervalId); // Clean up the interval on unmount
        }
    }, [isEnableConsume, isAuthenticated]);

    async function publish(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData: FormData = new FormData(e.currentTarget);
        const message: File | string = formData.get('message');
        if (message) {
            const payload = {
                topic_name: TOPIC_NAME,
                records: [{value: message}]
            };
            console.log("Publishing message: ", payload)
            const token = await acquireToken();
            fetch("https://rjwakum75j.execute-api.ap-southeast-1.amazonaws.com/playground/kafka/publish-message", {
                method: 'POST',
                headers: {
                    'Content-Type': headerContentType,
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(payload),
            }).then(response => {
                if (response.status === 200) {
                    console.log('Message published successfully');
                } else {
                    console.error('Error publishing message');
                }
            });
        }
    }

    function doLogin() {
        if (accounts.length > 0) {
            return (
                <div>
                    <h1>Authenticated</h1>
                    <h2>Welcome {accounts[0].username}</h2>
                </div>
            )
        } else if (inProgress === 'login') {
            return (
                <h1>Logging in...</h1>
            )
        } else {
            return (
                <div>
                    <h1>Not Authenticated</h1>
                    <button onClick={() => instance.loginPopup()}>Login</button>
                </div>
            )
        }
    }

    async function acquireToken() {
        const tokenRequest = {
            scopes: ['User.Read'],
            account: accounts[0]
        };

        try {
            const response = await instance.acquireTokenSilent(tokenRequest);
            if (response.accessToken) {
                return response.accessToken;
            }
        } catch (error) {
            console.error(error);
            try {
                const response = await instance.acquireTokenPopup(tokenRequest);
                if (response.accessToken) {
                    return response.accessToken;
                }
            } catch (error) {
                console.error(error);
                return "";
            }
        }
        return "";
    }

    return (
        <>
            {isAuthenticated ?
                <div>
                    <div>
                        <h1>Fetched Data</h1>
                        <pre>{JSON.stringify(output, null, 2)}</pre>
                    </div>
                    <div>
                        <h1>Publish Data</h1>
                        <form onSubmit={(e) => publish(e)}>
                            <label>
                                Message:
                                <input type="text" name="message"/>
                            </label>
                            <button type="submit">Publish</button>
                        </form>
                    </div>
                </div> :
                doLogin()
            }
        </>
    )
}

export default App
