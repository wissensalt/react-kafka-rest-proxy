import {useEffect, useState} from "react";

function App() {
    const [data, setData] = useState(null);
    const POLLING_INTERVAL: number = 2000; // Poll every 2 seconds
    const RECREATE_POLLING_INTERVAL: number = 5000; // Poll every 5 seconds
    const consumerGroup: string = 'frontend-consumer-group';
    const consumerInstance: string = 'fec_1';
    const headerAccept: string = 'application/vnd.kafka.json.v2+json';
    const headerContentType: string = 'application/vnd.kafka.json.v2+json';
    const consumeMessageUrl: string = "http://localhost:8082/consumers/".concat(consumerGroup).concat("/instances/").concat(consumerInstance).concat("/records");
    const createConsumerInstanceUrl: string = "http://localhost:8082/consumers/".concat(consumerGroup);
    const subscribeUrl: string = "http://localhost:8082/consumers/".concat(consumerGroup).concat("/instances/").concat(consumerInstance).concat("/subscription");
    const payloadCreateConsumerInstance = {name: consumerInstance, format: 'json', 'auto.offset.reset': 'earliest'};
    const [isEnableConsume, setIsEnableConsume] = useState(false);
    const [output, setOutput] = useState<Array<string> | []>([])

    useEffect(() => {
        const fetchData = async (): Promise<void> => {
            if (isEnableConsume) {
                try {
                    const response = await fetch(consumeMessageUrl, {
                        headers: {
                            'Accept': headerAccept,
                            'Content-Type': headerContentType
                        }
                    });
                    const result = await response.json();
                    if (result.error_code || result.error_code === 40403) {
                        setIsEnableConsume(false);
                        console.error('Error fetching data: Trying to re-create the consumer instance', result);
                        return;
                    } else {
                        if (result[0].value) {
                            if (output.length === 0) {
                                setOutput([result[0].value]);
                            } else {
                                setOutput([...output, result[0].value]);
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
    }, [isEnableConsume, output]); // Empty array ensures this runs only once on mount

    useEffect(() => {
        const reCreateConsumer = async (): Promise<void> => {
            if (!isEnableConsume) {
                const response: Promise<void> = fetch(createConsumerInstanceUrl, {
                    method: 'POST',
                    headers: {
                        'Accept': headerAccept,
                        'Content-Type': headerContentType
                    },
                    body: JSON.stringify(payloadCreateConsumerInstance)
                }).then(
                    async (response) => {
                        console.log("LOG RESPONSE create consumer instance: ", response);
                        console.log("is enable consume", isEnableConsume);
                        if (response.status === 200) {
                            console.log("Consumer instance created successfully");
                            await fetch(subscribeUrl, {
                                method: 'POST',
                                headers: {
                                    'Accept': headerAccept,
                                    'Content-Type': headerContentType
                                },
                                body: JSON.stringify({topics: ['topic-one',]})
                            }).then(
                                async (response) => {
                                    console.log("LOG RESPONSE subscribe: ", response);
                                    if (response.status === 204) {
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
                                console.error("Consumer instance already exists, trying to re-subscribe");
                                const response = await fetch(subscribeUrl, {
                                    method: 'POST',
                                    headers: {
                                        'Accept': headerAccept,
                                        'Content-Type': headerContentType
                                    },
                                    body: JSON.stringify({topics: ['topic-one',]})
                                }).then(
                                    async (response) => {
                                        console.log("LOG RESPONSE subscribe: ", response);
                                        if (response.status === 204) {
                                            console.log("Subscribed to topic successfully");
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
        reCreateConsumer(); // Fetch immediately on mount
        const intervalId: number = setInterval(reCreateConsumer, RECREATE_POLLING_INTERVAL); // Set up polling

        return () => clearInterval(intervalId); // Clean up the interval on unmount

    }, [isEnableConsume]);

    return (
        <>
            <div>
                <h1>Fetched Data</h1>
                <pre>{JSON.stringify(output, null, 2)}</pre>
            </div>
        </>
    )
}

export default App
