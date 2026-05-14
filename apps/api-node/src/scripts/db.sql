create table messaging.users
(
    id             int auto_increment primary key,
    username       varchar(50)                         not null,
    email          varchar(100)                        not null,
    password_hash  varchar(255)                        not null,
    first_name     varchar(50)                         not null,
    last_name      varchar(50)                         not null,
    device_address varchar(50)                         null,
    created_at     timestamp default CURRENT_TIMESTAMP null,
    last_seen      timestamp                           null,
    constraint email
        unique (email),
    constraint username
        unique (username)
);

create index idx_email
    on messaging.users (email);

create index idx_username
    on messaging.users (username);



create table messaging.messages
(
    id                   int auto_increment primary key,
    sender_id            int                                 not null,
    recipient_id         int                                 not null,
    subject              varchar(255)                        null,
    client_message_id    varchar(255)                        null,
    body                 text                                not null,
    sent_at              timestamp default CURRENT_TIMESTAMP null,
    sender_address       varchar(20)                         null,
    read_at              timestamp                           null,
    reader_address       varchar(20)                         null,
    deleted_by_sender    datetime                            null,
    deleted_by_recipient datetime                            null,
    constraint messages_ibfk_1
        foreign key (sender_id) references messaging.users (id)
            on delete cascade,
    constraint messages_ibfk_2
        foreign key (recipient_id) references messaging.users (id)
            on delete cascade
);

create unique index uq_client_message_id
    on messaging.messages (client_message_id);

create index idx_read_status
    on messaging.messages (recipient_id, read_at);

create index idx_recipient
    on messaging.messages (recipient_id);

create index idx_sender
    on messaging.messages (sender_id);

create index idx_sent_at
    on messaging.messages (sent_at);


create table messaging.threads
(
    id         int auto_increment
        primary key,
    origin_msg int                                not null,
    created_at datetime default CURRENT_TIMESTAMP not null,
    constraint threads_msg_fk
        foreign key (origin_msg) references messaging.messages (id)
);


create table messaging.thread_messages
(
    thread_id int not null,
    msg_id    int not null,
    reply_to  int not null,
    primary key (thread_id, msg_id, reply_to)
);
