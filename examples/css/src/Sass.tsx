import "./styles/saas.scss";
import styles from "./styles/sass.module.scss";
import styles2 from "./styles/sass2.module.scss";

const Sass = () => {
    return (
        <div>
            <div className="global-container">
                This container is styled with sass global style
            </div>
            <div className={styles.module}>
                This container is styled with sass module style
            </div>
            <div className={styles2.module}>
                This container is also styled with sass module style
            </div>
        </div>
    );
};
export default Sass;
