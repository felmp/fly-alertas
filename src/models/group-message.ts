export type Message = {
  text: string;
};

export type Contact = {
  first_name: string | null;
  last_name: string | null;
  profile_pic_url: string;
  friendly_name: string;
  device: string | null;
};

export type Participant = {
  phone_number: string;
  device: string;
  pushname: string;
};

export type GroupMessage = {
  id: string;
  uuid: string;
  session_key: string;
  message: Message;
  created_at: string;
  channel_phone_number: string;
  sent_by: string;
  contact: Contact;
  participant: Participant;
};