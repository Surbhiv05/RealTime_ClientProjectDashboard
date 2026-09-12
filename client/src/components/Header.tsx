interface HeaderProps {
    onLogout: () => void;
}

const Header = ({
    onLogout,
}: HeaderProps) => {
    return (
        <header
            style={{
                height: "72px",
                backgroundColor: "#FFFFFF",
                borderBottom:
                    "1px solid #D9E2DD",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 28px",
                boxSizing: "border-box",
            }}
        >
            <div>
                <h2
                    style={{
                        margin: 0,
                        color: "#0F4C5C",
                        fontSize: "20px",
                    }}
                >
                    Client Project Dashboard
                </h2>

                <p
                    style={{
                        margin: "3px 0 0",
                        fontSize: "12px",
                        color: "#6B6A67",
                    }}
                >
                    Track projects, tasks and activity
                </p>
            </div>

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                }}
            >
                <div
                    style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "50%",
                        backgroundColor: "#84A98C",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#FFFFFF",
                        fontWeight: "bold",
                    }}
                >
                    U
                </div>

                <button
                    onClick={onLogout}
                    style={{
                        border: "none",
                        backgroundColor: "#F4C95D",
                        color: "#2D2A26",
                        padding: "9px 15px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "600",
                    }}
                >
                    Logout
                </button>
            </div>
        </header>
    );
};

export default Header;