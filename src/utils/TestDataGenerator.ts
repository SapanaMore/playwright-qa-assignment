/**
 * Utility to generate random, deterministic test data
 * for the Restful-Booker Platform.
 */
export class TestDataGenerator {
    private static counter = 0;

    private static nextId(): number {
        // Keep IDs short (4-5 digits) to stay within API field length limits (max 18 chars)
        return (Math.floor(Math.random() * 90000) + 10000) + ++this.counter;
    }

    /** Future date string (YYYY-MM-DD) offset by the given number of days. */
    static futureDate(daysFromNow: number): string {
        const d = new Date();
        d.setDate(d.getDate() + daysFromNow);
        return d.toISOString().split('T')[0];
    }

    /** Generate a booking payload for the automationintesting.online API. */
    static generateBooking(roomId: number = 1) {
        const id = this.nextId();
        const checkinOffset = 730 + Math.floor(Math.random() * 300); // 2+ years out
        return {
            roomid: roomId,
            firstname: `Tester${id}`,
            lastname: `QA${id}`,
            depositpaid: true,
            bookingdates: {
                checkin: this.futureDate(checkinOffset),
                checkout: this.futureDate(checkinOffset + 3),
            },
            email: `tester${id}@example.com`,
            phone: '12345678901',
        };
    }

    /** Generate a room payload. */
    static generateRoom() {
        const id = Math.floor(Math.random() * 9000) + 1000;
        return {
            roomName: `R${id}`,
            type: 'Double',
            accessible: true,
            image: '/images/room1.jpg',
            description: 'A comfortable double room with a lovely view.',
            features: ['WiFi', 'TV', 'Safe'],
            roomPrice: 150,
        };
    }

    /** Generate a contact message payload. */
    static generateMessage() {
        const id = Math.floor(Math.random() * 9000) + 1000;
        return {
            name: `User ${id}`,
            email: `user${id}@example.com`,
            phone: '12345678901',
            subject: `Room Availability Inquiry ${id}`,
            description:
                'Hello, I would like to know if there are any rooms available for next month. Thank you very much for your help!',
        };
    }
}
