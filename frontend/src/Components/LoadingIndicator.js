export default function LoadingIndicator(props){
    const rozbij = () => {
        const rozbite = props.text.split("\n");
        return rozbite.map((v, i) => {
            return <b key={"loading_"+i}>{v}</b>
        })
    }

    return(
        <div className="loading">
            <div className="lds-ellipsis"><div /><div /><div /><div /></div>
            {props.text && rozbij()}
        </div>
    )
};