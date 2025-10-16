import mongoConnect from "@/lib/mongodb";
import User from "@/Models/User";
import { NextResponse } from "next/server";

export async function GET(request,{params}) {
    await mongoConnect();
    console.log("Connected to MongoDB");
    const { id } = await params;
    const getUserById = await User.findById(id).lean();
    if(!getUserById){
        return NextResponse.json({message: 'User not found'}, {status: 404});
    }
    return NextResponse.json({ getUserById });
}

export async function PUT(request,{params}){
    await mongoConnect();
    console.log("Connected to MongoDB");
    const { id } = await params;
    const { username } = await request.json();
    if(!username){
        return NextResponse.json({message: 'username is required'}, {status: 400});
    }
    if(!id){
        return NextResponse.json({message: 'User ID is required'}, {status: 400});
    }
    const updateUserById = await User.findByIdAndUpdate(id, { username }, { new: true }).lean();
    if(!updateUserById){
        return NextResponse.json({message: 'User not found'}, {status: 404});
    }
    return NextResponse.json({ user: updateUserById });

}

export async function DELETE(request,{params}){
    await mongoConnect();
    console.log("Connected to MongoDB");
    const { id } = await params;
    const deleteUserById = await User.findByIdAndDelete(id).lean();
    if(!deleteUserById){
        return NextResponse.json({message: 'User not found'}, {status: 404});
    }
    return NextResponse.json({ message: 'User deleted successfully' });
}