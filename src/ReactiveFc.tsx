const ReactiveFc = ({ count }) => {
    return (
        <div>
            {count % 2 == 0 ? (
                <span className="even">even</span>
            ) : (
                <span className="odd">odd</span>
            )}
        </div>
    );
};
export default ReactiveFc;
