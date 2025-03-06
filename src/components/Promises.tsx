import { createPromise } from "../index";

const getUser = async () => {
    return fetch("https://jsonplaceholder.typicode.com/users/1")
        .then((response) => {
            if (!response.ok) {
                throw new Error(response.status.toString());
            }
            return response.json();
        })
        .then((json) => json.username)
        .catch((err: Error) => {
            throw new Error("Cannot fetch User. Error: " + err.message);
        });
};

const Users = () => {
    const promise = createPromise(getUser);

    return (
        <div>
            {() => {
                if (promise.value.data) {
                    return <div>{promise.value.data}</div>;
                }
                if (promise.value.error) {
                    return <div>{promise.value.error.message}</div>;
                }
                return <div>Loading...</div>;
            }}
        </div>
    );
};

export default Users;
