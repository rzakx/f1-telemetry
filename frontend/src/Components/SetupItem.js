export default function SetupItem(props){

    const calcFill = () => {
        const range = Number(props.max) - Number(props.min);
        const percentage = (props.value - props.min) ? ((props.value - props.min)*100/range) : 0;
        return percentage;
    };

    return(
        <div className="setupItem">
            <div className="setupItemTop">
                <b>{props.title}</b>
                <b>{props.value}{props.unit}</b>
            </div>
            <div className="setupItemBottom">
                {props.min}{props.unit} <input type="range" style={{background: `linear-gradient(90deg, #7b1c4a ${calcFill()}%, #9b9b9b ${calcFill()}%)`}} min={props.min} max={props.max} step={props.step} value={props.value} onChange={(e) => props.changeItem(props.name, e.target.value)} disabled={props.disabled}/> {props.max}{props.unit}
            </div>
        </div>
    )
};