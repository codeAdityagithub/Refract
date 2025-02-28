import { css } from "@emotion/css";

const color = "white";

const Emotion = () => {
    return (
        <div>
            <h2>Styled with Emotion</h2>
            <div
                className={css`
                    padding: 16px;
                    background-color: hotpink;
                    font-size: 24px;
                    border-radius: 4px;
                    &:hover {
                        color: ${color};
                    }
                `}
            >
                Hover to change color.
            </div>
            {/* <Button>Styled emotion component</Button> */}
        </div>
    );
};
export default Emotion;
