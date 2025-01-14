const Test = ({ count }: { count: number }) => {
    return count % 2 == 0 ? (
        <div
            onClick={() => {
                console.log("even div");
            }}
        >
            <h1>Hello</h1>
            even
        </div>
    ) : (
        <span>odd</span>
    );
};
export default Test;
