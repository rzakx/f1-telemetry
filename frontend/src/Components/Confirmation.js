export default function Confirmation(props){
    return(
        <div className="confirmationPopupBg">
            <div className="confirmationPopup">
                <h3>{props.message}</h3>
                <button className="actionBtn danger" onClick={props.confirmAction}>Confirm</button> <button className="actionBtn" onClick={props.cancelAction}>Cancel</button>
            </div>
        </div>
    );
}