def check_username(username: str) -> str:
    if "@" in username:
        raise ValueError("Username must not contain '@'")
    try:
        int(username)
    except ValueError:
        return username
    raise ValueError("Username must not be numeric")
