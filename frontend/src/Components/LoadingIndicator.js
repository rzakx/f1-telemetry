export default function LoadingIndicator(props){
    return(
        <div className="loading">
            <div className="lds-ellipsis"><div /><div /><div /><div /></div>
            {props.text && <b>{props.text}</b>}
        </div>
    )
};