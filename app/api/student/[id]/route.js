import mongoConnect from "@/lib/mongodb";

export async function GET(request,{params}) {
    await mongoConnect();
    console.log("Connected to MongoDB");
}

export async function PUT(request,{params}) {
    await mongoConnect();
    console.log("Connected to MongoDB");
}

export async function DELETE(request,{params}) {
    await mongoConnect();
    console.log("Connected to MongoDB");
}